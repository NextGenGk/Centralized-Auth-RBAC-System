# Centralized Authentication & RBAC for Microservices

> **Role-Based Access Control (RBAC) Microservices System**  
> **Stack:** Node.js · TypeScript · Express · PostgreSQL · Redis · Prisma · Docker · Swagger

---

## 📋 Table of Contents

1. [Architecture Explanation](#architecture-explanation)
2. [Auth & RBAC Flow](#auth--rbac-flow)
3. [Setup Instructions](#setup-instructions)
4. [Environment Variables](#environment-variables)
5. [Security Decisions](#security-decisions)
6. [Bonus Features](#bonus-features-implemented)
7. [API Documentation](#api-documentation)
8. [Project Structure](#project-structure)

---

## Architecture Explanation

### System Overview

Two independent microservices communicate only through JWT tokens — no shared database, no runtime coupling between services.

```
[ Client (Browser / App) ]
           │
           │  POST /auth/login  (email + password)
           ▼
[ Auth Service  :3001 ]  ──── PostgreSQL  (users, roles, permissions)
           │             ──── Redis       (refresh tokens, blacklist)
           │
           │  JWT Access Token (RS256, signed with RSA private key)
           ▼
[ Orders Service  :3002 ]
           │  Verifies JWT with RSA public key only — no Auth DB call
           ▼
[ 200 OK  /  401 Unauthorized  /  403 Forbidden ]
```

### Services

| Service | Port | Responsibility |
|---|---|---|
| **Auth Service** | 3001 | Identity, token issuance, RBAC management |
| **Orders Service** | 3002 | Protected resource — enforces permissions via JWT |
| **PostgreSQL** | 5432 | Users, roles, permissions, audit logs |
| **Redis** | 6379 | Refresh token store + access token blacklist |

### Identity & Access Model

```
User ──< UserRole >── Role ──< RolePermission >── Permission
                      (admin)                      (orders:read)
                      (manager)                    (orders:write)
                      (user)                       (orders:delete)
```

**Permission format:** `<resource>:<action>` — e.g. `orders:read`, `orders:delete`

**Seeded test users:**

| Email | Password | Role | Key Permissions |
|---|---|---|---|
| admin@example.com | Admin@1234 | admin | All |
| manager@example.com | Manager@1234 | manager | orders:read/write/delete, reports:read |
| user@example.com | User@1234 | user | orders:read only |

---

## Auth & RBAC Flow

### 1. Registration

1. Client sends `POST /auth/register` with email + password
2. Password is hashed via **bcrypt (cost 12)**
3. User is created and auto-assigned the default **"user"** role (read-only)

### 2. Login

1. Client sends `POST /auth/login`
2. Auth Service verifies bcrypt hash against PostgreSQL record
3. All roles + permissions are **embedded directly into the JWT payload**
4. Returns a short-lived **Access Token (15 min, RS256)** and a **Refresh Token (7 days)**
5. Refresh token is stored in **Redis** with TTL

### 3. Accessing a Protected Route

1. Client attaches `Authorization: Bearer <accessToken>` to every request
2. Orders Service middleware verifies the JWT using the **RSA public key only**
3. `requirePermission('orders:read')` checks `req.user.permissions` — **no DB call**
4. Valid → handler runs · Invalid → 401 or 403

### 4. Token Refresh

1. Client sends `POST /auth/refresh` with the current refresh token
2. Old refresh token deleted from Redis; new token pair issued **(rotation)**

### 5. Logout

1. Client sends `POST /auth/logout` with Bearer token
2. Access token **blacklisted** in Redis (TTL = remaining token lifetime)
3. Refresh token **deleted** from Redis — both tokens are dead instantly

### RBAC Permission Matrix

| Endpoint | Admin | Manager | User |
|---|:---:|:---:|:---:|
| GET /orders | ✅ | ✅ | ✅ |
| GET /orders/:id | ✅ | ✅ | ✅ |
| POST /orders | ✅ | ✅ | ❌ |
| PUT /orders/:id | ✅ | ✅ | ❌ |
| DELETE /orders/:id | ✅ | ✅ | ❌ |
| GET /admin/users | ✅ | ❌ | ❌ |
| POST /admin/roles | ✅ | ❌ | ❌ |
| GET /admin/audit-logs | ✅ | ❌ | ❌ |

---

## Setup Instructions

For full setup instructions covering all three deployment modes, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

### Quick Start (Docker)

```bash
# 1. Generate RSA keys
node scripts/generate-keys.js

# 2. Start all services
docker-compose up --build

# 3. Seed the database (once only, in a new terminal)
docker exec auth_service npx prisma migrate deploy
docker exec auth_service npx ts-node prisma/seed.ts
```

### Quick Start (Manual — Neon + Upstash)

```bash
# 1. Fill in auth-service/.env with your Neon + Upstash URLs
# 2. Generate RSA keys
node scripts/generate-keys.js

# 3. Start Auth Service
cd auth-service && npm install
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
npm run dev

# 4. Start Orders Service (new terminal)
cd orders-service && npm install && npm run dev
```

**Health checks:**
```
http://localhost:3001/health  →  {"status":"ok"}
http://localhost:3002/health  →  {"status":"ok"}
```

---

## Environment Variables

### Auth Service (`auth-service/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string (Neon/local) | — |
| `REDIS_URL` | Redis connection string (Upstash/local) | — |
| `JWT_PRIVATE_KEY` | Base64-encoded RSA private key | — |
| `JWT_PUBLIC_KEY` | Base64-encoded RSA public key | — |
| `JWT_ACCESS_EXPIRY` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token TTL | `7d` |
| `BCRYPT_ROUNDS` | bcrypt cost factor | `12` |
| `LOGIN_RATE_LIMIT` | Max login attempts per window | `10` |
| `LOGIN_RATE_WINDOW` | Rate limit window (seconds) | `900` |
| `GLOBAL_RATE_LIMIT` | Max requests per IP per window | `100` |
| `GLOBAL_RATE_WINDOW` | Global window (seconds) | `60` |

### Orders Service (`orders-service/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP port | `3002` |
| `NODE_ENV` | Environment | `development` |
| `JWT_PUBLIC_KEY` | Base64-encoded RSA public key (same as auth-service) | — |
| `AUTH_SERVICE_URL` | Auth service base URL | `http://localhost:3001` |

See `auth-service/.env.example` and `orders-service/.env.example` for templates.

---

## Security Decisions

| Decision | Rationale |
|---|---|
| **RS256 (asymmetric JWT) over HS256** | With HS256, every verifying service must share the secret — meaning any service could forge tokens. RS256 uses a private key (Auth Service only) to sign and a public key (shared) to verify. The Orders Service can never create a token. |
| **Permissions embedded in JWT payload** | Introspection-based RBAC calls the Auth Service on every request, creating a bottleneck. Embedding permissions at login means resource services are fully autonomous — no extra network hop on every request. |
| **Redis for refresh tokens + blacklist** | JWT is stateless — logout is meaningless without state. Redis stores refresh tokens with TTL (logout = delete key) and blacklists access tokens until natural expiry. |
| **Short-lived access tokens (15 min)** | Limits damage window if a token is intercepted. |
| **Refresh token rotation** | Every `/auth/refresh` invalidates the old refresh token. Prevents silent long-lived session hijacking. |
| **bcrypt cost factor 12** | ~300ms per hash — expensive enough to resist brute-force, fast enough for real users. |
| **Rate limiting on login** | 10 attempts per 15 min prevents automated credential stuffing. |
| **Helmet.js** | Sets secure HTTP headers (CSP, HSTS, X-Frame-Options, X-Content-Type, etc.). |
| **No sensitive data in JWT** | Payload contains only `id`, `email`, `roles`, `permissions` — no passwords or PII. |
| **Disabled users blocked at login** | `isActive: false` prevents new token issuance; existing tokens expire naturally. |
| **PostgreSQL over MongoDB** | RBAC requires clean many-to-many joins (Users ↔ Roles ↔ Permissions). PostgreSQL handles these with referential integrity. |
| **Prisma as ORM** | Schema-first, auto-generated TypeScript types catch relation errors at compile time — not during an auth check at runtime. |

---

## Bonus Features Implemented

| Feature | Details |
|---|---|
| ✅ Token revocation / blacklist | Access token stored in Redis on logout (TTL = remaining lifetime) |
| ✅ Redis refresh token store | Rotated on every `/auth/refresh`; deleted on logout |
| ✅ Audit logs | Every login, register, and order action logged with `userId`, `action`, `IP`, `timestamp` |
| ✅ Rate limiting | Per-route (login) + global (all endpoints) |
| ✅ Docker Compose | 4 containers with health checks — postgres, redis, auth-service, orders-service |
| ✅ Swagger / OpenAPI | Interactive docs at `/api-docs` for both services |

---

## API Documentation

Interactive Swagger UI (available at runtime):

| Service | URL |
|---|---|
| **Auth Service** | http://localhost:3001/api-docs |
| **Orders Service** | http://localhost:3002/api-docs |

Full endpoint documentation with request/response examples: **[SWAGGER_GUIDE.md](./SWAGGER_GUIDE.md)**

---

## Project Structure

```
auth-rbac-system/
├── auth-service/
│   ├── prisma/
│   │   ├── schema.prisma          # DB schema — single source of truth
│   │   └── seed.ts                # Seeds roles, permissions, and users
│   ├── src/
│   │   ├── config/                # Env config + Swagger setup
│   │   ├── controllers/           # auth.controller, admin.controller
│   │   ├── middleware/            # authenticate, requirePermission, validate, errorHandler
│   │   ├── routes/                # auth.routes, admin.routes
│   │   ├── services/              # auth.service, token.service
│   │   ├── types/                 # Shared TypeScript interfaces
│   │   ├── utils/                 # jwt, bcrypt, redis, logger, AppError
│   │   ├── app.ts                 # Express app
│   │   └── server.ts              # Bootstrap (DB + Redis + HTTP)
│   ├── Dockerfile
│   ├── .env.example               # ← Copy to .env and fill in values
│   └── package.json
├── orders-service/
│   ├── src/
│   │   ├── config/                # Env config + Swagger setup
│   │   ├── controllers/           # orders.controller
│   │   ├── middleware/            # authenticate, requirePermission, errorHandler
│   │   ├── routes/                # orders.routes
│   │   ├── types/                 # JwtPayload, Order interfaces
│   │   ├── utils/                 # AppError, logger
│   │   ├── app.ts
│   │   └── server.ts
│   ├── Dockerfile
│   ├── .env.example               # ← Copy to .env and paste the same public key
│   └── package.json
├── scripts/
│   ├── generate-keys.sh           # Bash key generator (Linux/macOS)
│   └── generate-keys.js           # Node.js key generator (Windows/cross-platform)
├── docker-compose.yml
├── README.md                      # ← You are here
├── DEPLOYMENT.md                  # Docker + Manual + Vercel setup guide
└── SWAGGER_GUIDE.md               # Full API documentation with examples
```
