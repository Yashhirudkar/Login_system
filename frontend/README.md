# 🎨 Auth Frontend — Next.js (App Router) + Tailwind CSS

A modern, responsive, and secure frontend built for the OAuth 2.0 Auth System. It features glassmorphism design, Lucide React icons, and robust JWT token management.

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.local.example .env.local
# Make sure the backend URL is correct
```

### 3. Start Development Server
```bash
npm run dev
```

Visit: `http://localhost:3000`

---

## 📁 Folder Structure

```
frontend/
├── app/
│   ├── dashboard/           
│   │   └── page.jsx         ← Protected user dashboard
│   ├── login/               
│   │   └── page.jsx         ← Login form with error handling
│   ├── register/            
│   │   └── page.jsx         ← Registration form with validation
│   ├── globals.css          ← Tailwind CSS + Glassmorphism tokens
│   ├── layout.jsx           ← Root layout wrapping AuthProvider
│   └── page.jsx             ← Redirects to dashboard
├── components/
│   └── AuthGuard.jsx        ← HOC to protect private routes
├── context/
│   └── AuthContext.jsx      ← Global state (user session, login, logout)
├── services/
│   ├── api.js               ← Axios instance + Token Auto-Refresh Interceptors
│   └── authService.js       ← API wrappers for auth endpoints
├── .env.local.example
├── tailwind.config.js       ← Tailwind custom theme (Primary colors)
├── postcss.config.js
└── package.json
```

---

## 🔐 Security Mechanics

1. **Access Token Storage**
   Stored **strictly in-memory** (inside `AuthContext` / `api.js` closures). It is never saved to `localStorage`, avoiding XSS attacks.

2. **Refresh Token Storage**
   Managed entirely by the backend via `HttpOnly`, `Secure`, `SameSite=Strict` cookies. The frontend never sees it directly.

3. **Silent Token Refresh (Axios Interceptor)**
   When an API call returns `401 Unauthorized`, the `api.js` interceptor automatically pauses pending requests, calls `/api/auth/refresh`, updates the in-memory access token, and retries the original request seamlessly.

4. **CSRF Protection**
   All requests send a custom `X-Requested-With: XMLHttpRequest` header, which the backend can use to reject cross-site forged requests if configured.

---

## 🎨 UI/UX Features

- **Tailwind CSS + Glassmorphism**: Premium frosted-glass aesthetics with `backdrop-blur` and soft gradients.
- **Micro-interactions**: Smooth hover effects, ring-focus states, and loading spinners.
- **Responsive Design**: Mobile-first architecture ensures the UI looks perfect on phones to 4K displays.
- **Lucide Icons**: Beautiful, clean SVG icons (`User`, `Lock`, `Mail`, `ShieldCheck`).
- **Loading UI**: Clean skeleton states and full-screen auth-guard loaders prevent UI flashing while checking sessions.
