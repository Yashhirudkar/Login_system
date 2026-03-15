const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user.model');
const redis = require('../config/redis');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const auditLogger = require('../utils/auditLogger');
const { Op } = require('sequelize');

const REFRESH_TOKEN_PREFIX = 'refresh:';
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

class AuthService {
  async register({ name, email, password }) {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      const err = new Error('Email already registered');
      err.status = 409;
      throw err;
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, passwordHash });
    return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
  }

  async login({ email, password }) {
    const user = await User.findOne({ where: { email } });

    // Check if account is locked
    if (user && user.lockUntil && user.lockUntil > new Date()) {
      auditLogger.log('LOGIN_FAILED_LOCKED', { email, userId: user.id });
      const err = new Error('Account is temporarily locked. Try again later.');
      err.status = 423;
      throw err;
    }

    // Always run bcrypt.compare to prevent timing attacks
    const hash = user ? user.passwordHash : '$2a$12$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const isMatch = await bcrypt.compare(password, hash);

    if (!user || !isMatch) {
      if (user) {
        // Increment failed attempts
        user.failedLoginAttempts += 1;
        if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
          user.lockUntil = new Date(Date.now() + LOCK_TIME);
          auditLogger.log('ACCOUNT_LOCKED', { email, userId: user.id });
        }
        await user.save();
      }

      auditLogger.log('LOGIN_FAILED', { email });
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    if (!user.isActive) {
      auditLogger.log('LOGIN_FAILED_DEACTIVATED', { email, userId: user.id });
      const err = new Error('Account is deactivated');
      err.status = 403;
      throw err;
    }

    // Reset failed attempts on success
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    auditLogger.log('LOGIN_SUCCESS', { email, userId: user.id });

    const payload = { sub: user.id, email: user.email, name: user.name };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ sub: user.id });

    // Store refresh token in Redis: key → refresh:<userId>:<tokenId>
    const tokenId = uuidv4();
    const refreshKey = `${REFRESH_TOKEN_PREFIX}${user.id}:${tokenId}`;
    const refreshExpirySec = parseInt(process.env.REFRESH_EXPIRES_SECONDS || 604800); // 7 days
    await redis.set(refreshKey, refreshToken, 'EX', refreshExpirySec);

    return {
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
      tokenId,
    };
  }

  async getMe(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'isActive', 'createdAt', 'updatedAt'],
    });
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    return user;
  }

  async logout({ userId, tokenId, accessToken }) {
    // Blacklist access token
    if (accessToken) {
      try {
        const { verifyAccessToken } = require('../utils/jwt');
        const decoded = verifyAccessToken(accessToken);
        const exp = decoded.exp;
        const now = Math.floor(Date.now() / 1000);
        const ttl = exp - now;
        if (ttl > 0) {
          // Hash token before blacklisting to save memory
          const tokenHash = require('crypto')
            .createHash('sha256')
            .update(accessToken)
            .digest('hex');
          await redis.set(`blacklist:${tokenHash}`, '1', 'EX', ttl);
        }
      } catch (_) {
        // token already expired — no need to blacklist
      }
    }

    // Delete refresh token from Redis
    if (userId && tokenId) {
      await redis.del(`${REFRESH_TOKEN_PREFIX}${userId}:${tokenId}`);
      auditLogger.log('LOGOUT', { userId, tokenId });
    }
    return true;
  }

  async refreshAccessToken({ userId, tokenId, refreshToken }) {
    const refreshKey = `${REFRESH_TOKEN_PREFIX}${userId}:${tokenId}`;
    const storedToken = await redis.get(refreshKey);

    // Verify incoming refreshToken match storedToken in Redis
    if (!storedToken || storedToken !== refreshToken) {
      const err = new Error('Refresh token not found or expired. Please login again.');
      err.status = 401;
      throw err;
    }

    try {
      verifyRefreshToken(storedToken);
    } catch (_) {
      await redis.del(refreshKey);
      const err = new Error('Refresh token expired. Please login again.');
      err.status = 401;
      throw err;
    }

    const user = await User.findByPk(userId, { attributes: ['id', 'email', 'name'] });
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    // Refresh Token Rotation: Delete old token and issue new ones
    await redis.del(refreshKey);

    const newPayload = { sub: user.id, email: user.email, name: user.name };
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken({ sub: user.id });
    const newTokenId = uuidv4();

    // Store new refresh token
    const newRefreshKey = `${REFRESH_TOKEN_PREFIX}${user.id}:${newTokenId}`;
    const refreshExpirySec = parseInt(process.env.REFRESH_EXPIRES_SECONDS || 604800);
    await redis.set(newRefreshKey, newRefreshToken, 'EX', refreshExpirySec);

    auditLogger.log('TOKEN_REFRESH', { userId: user.id, tokenId: newTokenId });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenId: newTokenId
    };
  }
}

module.exports = new AuthService();
