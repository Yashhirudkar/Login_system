const Redis = require('ioredis');

let redis;

if (process.env.DISABLE_REDIS === 'true') {
  console.log('⚠️ Redis is DISABLED. Using in-memory fallback.');

  const store = new Map();
  const timeouts = new Map();

  redis = {
    set: async (key, value, mode, ttl) => {
      store.set(key, value);
      if (mode === 'EX' && ttl) {
        if (timeouts.has(key)) clearTimeout(timeouts.get(key));
        const timeout = setTimeout(() => {
          store.delete(key);
          timeouts.delete(key);
        }, ttl * 1000);
        timeouts.set(key, timeout);
      }
      return 'OK';
    },
    get: async (key) => store.get(key) || null,
    del: async (key) => {
      if (timeouts.has(key)) clearTimeout(timeouts.get(key));
      timeouts.delete(key);
      return store.delete(key);
    },
    incr: async (key) => {
      const val = parseInt(store.get(key) || 0) + 1;
      store.set(key, val.toString());
      return val;
    },
    pexpire: async (key, ms) => {
      if (timeouts.has(key)) clearTimeout(timeouts.get(key));
      const timeout = setTimeout(() => {
        store.delete(key);
        timeouts.delete(key);
      }, ms);
      timeouts.set(key, timeout);
      return 1;
    },
    pttl: async (key) => {
      // Return a fixed value for simplicity in mock
      return 60000;
    },
    ttl: async (key) => {
      return 60;
    },
    on: () => { }, // Mock event listener
  };
} else {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
      if (times > 3) {
        console.error('❌ Redis connection failed multiple times. Please check your config or set DISABLE_REDIS=true');
        return null; // Stop retrying
      }
      return Math.min(times * 100, 3000);
    },
  });

  redis.on('connect', () => console.log('✅ Redis connected'));
  redis.on('error', (err) => console.error('❌ Redis error:', err.message));
}

module.exports = redis;
