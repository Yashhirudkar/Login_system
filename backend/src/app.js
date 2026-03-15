require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middleware/errorHandler');
const ipWhitelist = require('./middleware/ipWhitelist');
const { generalRateLimiter } = require('./middleware/rateLimiter');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: '🔐 Secure Auth API',
      version: '2.0.0',
      description: 'Production-ready Auth System — JWT, Refresh Tokens, Rate Limiting, Account Lockout',
    },
    servers: [{ url: 'http://localhost:5000' }],
    components: {
      securitySchemes: {
        BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    paths: {
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'Yash Hirudkar' },
                    email: { type: 'string', example: 'yashhirudkar100@gmail.com' },
                    password: { type: 'string', example: 'Yash123#' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'User registered successfully' },
            409: { description: 'Email already registered' },
            422: { description: 'Validation errors (weak password, invalid email)' },
            429: { description: 'Too many requests' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and get tokens',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'yashhirudkar100@gmail.com' },
                    password: { type: 'string', example: 'Yash123#' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful — returns accessToken + sets HttpOnly refresh cookie' },
            401: { description: 'Invalid credentials' },
            423: { description: 'Account locked after 5 failed attempts' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user profile',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Returns user object' },
            401: { description: 'Missing or invalid access token' },
          },
        },
      },
      '/api/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token (uses HttpOnly cookie)',
          responses: {
            200: { description: 'Returns new accessToken + rotates refresh cookie' },
            401: { description: 'Missing or invalid refresh token' },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout and blacklist tokens',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Logged out successfully, access token blacklisted' },
            401: { description: 'Unauthorized' },
          },
        },
      },
    },
  },
  apis: [],
});

const app = express();

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true, // needed for cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// ─── Request Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── IP Whitelisting ──────────────────────────────────────────────────────────
app.use(ipWhitelist);

// ─── General Rate Limit ───────────────────────────────────────────────────────
app.use('/api', (req, res, next) => {
  // Skip general rate limit for auth routes since they have their own stricter limiter
  if (req.path.startsWith('/auth')) return next();
  generalRateLimiter(req, res, next);
});


// ─── Swagger Docs ─────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: '🔐 Auth API Docs' }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ success: true, status: 'OK', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Centralized Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
