const { body, validationResult } = require('express-validator');
const authService = require('../services/auth.service');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  return null;
};

// POST /api/auth/register
const register = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),

  async (req, res, next) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const user = await authService.register(req.body);
      res.status(201).json({ success: true, message: 'User registered successfully', data: user });
    } catch (err) {
      next(err);
    }
  },
];

// POST /api/auth/login
const login = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),

  async (req, res, next) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const result = await authService.login(req.body);

      // Set refresh token as HttpOnly cookie
      const refreshExpiresDays = parseInt(process.env.REFRESH_EXPIRES_DAYS || 7);
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: refreshExpiresDays * 24 * 60 * 60 * 1000,
      });

      // Set tokenId cookie (so frontend can reference which refresh token to use)
      res.cookie('tokenId', result.tokenId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: refreshExpiresDays * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  },
];

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.sub);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const tokenId = req.cookies?.tokenId;
    await authService.logout({
      userId: req.user?.sub,
      tokenId,
      accessToken: req.token,
    });

    res.clearCookie('refreshToken');
    res.clearCookie('tokenId');

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const tokenId = req.cookies?.tokenId;
    const userId = req.cookies?.userId || req.body?.userId;

    if (!tokenId) {
      return res.status(401).json({ success: false, message: 'No refresh token cookie found' });
    }

    // Decode userId from refreshToken cookie
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token found' });
    }

    const { verifyRefreshToken } = require('../utils/jwt');
    const decoded = verifyRefreshToken(refreshToken);

    const result = await authService.refreshAccessToken({
      userId: decoded.sub,
      tokenId,
      refreshToken,
    });

    // Handle token rotation (if service returns new refreshToken)
    if (result.refreshToken) {
      const refreshExpiresDays = parseInt(process.env.REFRESH_EXPIRES_DAYS || 7);
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: refreshExpiresDays * 24 * 60 * 60 * 1000,
      };
      res.cookie('refreshToken', result.refreshToken, cookieOptions);
      res.cookie('tokenId', result.tokenId, cookieOptions);
    }

    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, logout, refresh };
