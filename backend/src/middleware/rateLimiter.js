const rateLimit = require('express-rate-limit');

// Redis store for rate-limit (using ioredis store for express-rate-limit)
// We implement a simple in-process store backed by Redis for robustness
const redis = require('../config/redis');

class RedisStore {
  constructor({ windowMs }) {
    this.windowMs = windowMs;
    this.prefix = 'rl:';
  }

  async increment(key) {
    const redisKey = `${this.prefix}${key}`;
    const current = await redis.incr(redisKey);
    if (current === 1) {
      await redis.pexpire(redisKey, this.windowMs);

      // Safety cleanup for memory leaks if Redis ever has issues or 
      // if this were a local store (per request instructions for robustness)
      if (this.cleanupTimer) clearTimeout(this.cleanupTimer);
      this.cleanupTimer = setTimeout(async () => {
        const remaining = await redis.ttl(redisKey);
        if (remaining <= 0) await redis.del(redisKey);
      }, this.windowMs + 1000);
    }
    const ttl = await redis.pttl(redisKey);
    return {
      totalHits: current,
      resetTime: new Date(Date.now() + ttl),
    };
  }

  async decrement(key) {
    const redisKey = `${this.prefix}${key}`;
    await redis.decr(redisKey);
  }

  async resetKey(key) {
    await redis.del(`${this.prefix}${key}`);
  }
}

const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,             // 20 requests per window (increased for testing)
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ windowMs: 60 * 1000 }),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again after 1 minute.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ windowMs: 15 * 60 * 1000 }),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
  },
});

module.exports = { authRateLimiter, generalRateLimiter };
