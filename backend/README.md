# 🔐 Auth Backend — Node.js + Express + PostgreSQL + Redis

Production-grade OAuth 2.0 authentication system with JWT access/refresh tokens, Redis rate limiting, IP whitelisting, and Swagger documentation.

---

## ⚡ Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your PostgreSQL and Redis settings
```

### 3. Start PostgreSQL and Redis
- PostgreSQL: ensure a database exists matching `DB_NAME`
- Redis: `redis-server` (default port 6379)

### 4. Run development server
```bash
npm run dev
```

Server starts at: `http://localhost:5000`  
Swagger UI: `http://localhost:5000/api-docs`

---

## 📁 Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js            ← PostgreSQL (Sequelize, sync alter:true)
│   │   └── redis.js         ← Redis (ioredis)
│   ├── controllers/
│   │   └── auth.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js    ← JWT verify + blacklist check
│   │   ├── rateLimiter.js        ← Redis-backed 5 req/min/IP
│   │   ├── ipWhitelist.js        ← IP_WHITELIST env filtering
│   │   └── errorHandler.js      ← Centralized error handler
│   ├── models/
│   │   └── user.model.js        ← Sequelize User model
│   ├── routes/
│   │   └── auth.routes.js
│   ├── services/
│   │   └── auth.service.js      ← Business logic
│   ├── utils/
│   │   └── jwt.js               ← Token sign/verify
│   ├── docs/
│   │   └── swagger.yaml         ← OpenAPI 3.0 spec
│   └── app.js
├── server.js
├── .env.example
└── package.json
```

---

## 🛣️ API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, get tokens |
| GET | `/api/auth/me` | ✅ | Get current user |
| POST | `/api/auth/logout` | ✅ | Revoke tokens |
| POST | `/api/auth/refresh` | Cookie | New access token |
| GET | `/health` | ❌ | Health check |

---

## 🔐 Auth Flow

```
Register → Login → Access Token (15m) + Refresh Token Cookie (7d)
           ↓
    GET /me with Bearer token
           ↓
    Token expires? → POST /refresh → New Access Token
           ↓
    Logout → Blacklist access token + Delete refresh from Redis
```

---

## 🔑 Environment Variables

See `.env.example` for full reference.

| Variable | Description |
|----------|-------------|
| `DB_*` | PostgreSQL connection settings |
| `REDIS_*` | Redis connection settings |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `IP_WHITELIST` | Comma-separated IPs (empty = allow all) |
| `CORS_ORIGIN` | Frontend URL for CORS |

---

## 🛡️ Security Features

- **Helmet** — Security HTTP headers
- **CORS** — Restricted to frontend origin
- **Rate Limiting** — 5 req/min on auth routes (Redis-backed)
- **IP Whitelisting** — Configurable via ENV
- **Bcrypt** — Password hashing (12 rounds)
- **JWT Blacklist** — Revoked tokens stored in Redis with TTL
- **HttpOnly Cookies** — Refresh token never exposed to JS

---

## 📖 Swagger Docs

Visit `http://localhost:5000/api-docs` after starting the server.

1. `POST /api/auth/register` → create account
2. `POST /api/auth/login` → copy `accessToken`
3. Click **Authorize** → paste token
4. Use protected endpoints
