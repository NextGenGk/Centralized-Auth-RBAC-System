# Deployment Guide — Centralized Auth & RBAC System

Complete instructions for running the system in three modes:
- **Option A** — Docker Compose (local, self-contained)
- **Option B** — Manual / Local (Neon + Upstash)
- **Option C** — Vercel (production cloud deployment)

---

## 🔑 Step 0: Generate RSA Keys (All Options)

This must be done **once** before any deployment. The keys are shared between both services.

```bash
# From the project root
node scripts/generate-keys.js
```

This will:
- Generate a 2048-bit RSA key pair
- Save PEM files to `keys/private.key` and `keys/public.key`
- Auto-fill `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` in both `.env` files

> ⚠️ **Never commit `.env` files or the `keys/` directory to Git.**  
> Both are already listed in `.gitignore`.

---

## 🐳 Option A — Docker Compose

Everything (PostgreSQL, Redis, Auth Service, Orders Service) runs in isolated containers.  
**No external accounts needed.**

### 1. Configure `.env` files

**`auth-service/.env`** — only the keys section is needed (Docker overrides DB/Redis):
```env
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/authdb
REDIS_URL=redis://redis:6379
JWT_PRIVATE_KEY=<auto-filled by generate-keys.js>
JWT_PUBLIC_KEY=<auto-filled by generate-keys.js>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_ROUNDS=12
LOGIN_RATE_LIMIT=10
LOGIN_RATE_WINDOW=900
GLOBAL_RATE_LIMIT=100
GLOBAL_RATE_WINDOW=60
```

**`orders-service/.env`**:
```env
PORT=3002
NODE_ENV=production
JWT_PUBLIC_KEY=<same value as auth-service>
AUTH_SERVICE_URL=http://auth-service:3001
```

### 2. Start all containers

```bash
docker-compose up --build
```

### 3. Run migrations & seed (first time only)

In a new terminal, wait for containers to be healthy, then:

```bash
docker exec auth_service npx prisma migrate deploy
docker exec auth_service npx ts-node prisma/seed.ts
```

### 4. Verify

```bash
curl http://localhost:3001/health   # → {"status":"ok"}
curl http://localhost:3002/health   # → {"status":"ok"}
```

**Swagger UI:**
- Auth Service: http://localhost:3001/api-docs
- Orders Service: http://localhost:3002/api-docs

### Useful Docker Commands

```bash
docker-compose down           # stop all containers
docker-compose down -v        # stop + delete volumes (wipes DB data)
docker-compose logs -f        # stream logs from all services
docker logs auth_service -f   # stream logs from auth service only
```

---

## 🛠️ Option B — Manual Setup (Neon + Upstash)

Use your own cloud database and Redis. No Docker required.

### Prerequisites

- Node.js ≥ 18
- A **Neon** account → [neon.tech](https://neon.tech) (free tier available)
- An **Upstash** account → [upstash.com](https://upstash.com) (free tier available)

### 1. Create a Neon Database

1. Go to [console.neon.tech](https://console.neon.tech) → New Project
2. Copy the **connection string** from the dashboard:
   ```
   postgresql://USER:PASS@ep-xxx-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

### 2. Create an Upstash Redis Database

1. Go to [console.upstash.com](https://console.upstash.com) → Create Database
2. Choose a region → Copy the **Redis URL**:
   ```
   rediss://default:TOKEN@assuring-xxxxx.upstash.io:6379
   ```

### 3. Configure `auth-service/.env`

```env
PORT=3001
NODE_ENV=development

DATABASE_URL=postgresql://USER:PASS@ep-xxx.aws.neon.tech/neondb?sslmode=require
REDIS_URL=rediss://default:TOKEN@your-host.upstash.io:6380

JWT_PRIVATE_KEY=<auto-filled by generate-keys.js>
JWT_PUBLIC_KEY=<auto-filled by generate-keys.js>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

BCRYPT_ROUNDS=12
LOGIN_RATE_LIMIT=10
LOGIN_RATE_WINDOW=900
GLOBAL_RATE_LIMIT=100
GLOBAL_RATE_WINDOW=60
```

### 4. Configure `orders-service/.env`

```env
PORT=3002
NODE_ENV=development
JWT_PUBLIC_KEY=<same base64 value as auth-service>
AUTH_SERVICE_URL=http://localhost:3001
```

### 5. Start Auth Service

```bash
cd auth-service
npm install
npx prisma migrate dev --name init    # creates tables in Neon
npx ts-node prisma/seed.ts            # seeds roles, permissions, users
npm run dev
```

### 6. Start Orders Service

Open a **new terminal**:

```bash
cd orders-service
npm install
npm run dev
```

### 7. Verify

```bash
curl http://localhost:3001/health   # → {"status":"ok"}
curl http://localhost:3002/health   # → {"status":"ok"}
```

**Swagger UI:**
- Auth Service: http://localhost:3001/api-docs
- Orders Service: http://localhost:3002/api-docs

---

## ☁️ Option C — Vercel Deployment

Deploy both services as serverless Node.js functions on Vercel.

### Prerequisites

- Vercel account → [vercel.com](https://vercel.com)
- Neon database (see Option B, Step 1)
- Upstash Redis (see Option B, Step 2)
- Vercel CLI: `npm i -g vercel`

### 1. Create `vercel.json` in each service

**`auth-service/vercel.json`:**
```json
{
  "version": 2,
  "builds": [{ "src": "src/server.ts", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/server.ts" }]
}
```

**`orders-service/vercel.json`:**
```json
{
  "version": 2,
  "builds": [{ "src": "src/server.ts", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/server.ts" }]
}
```

### 2. Deploy Auth Service

```bash
cd auth-service
vercel --prod
```

In the Vercel dashboard → **Settings → Environment Variables**, add:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your Neon connection string |
| `REDIS_URL` | Your Upstash Redis URL |
| `JWT_PRIVATE_KEY` | Base64 private key (from `auth-service/.env`) |
| `JWT_PUBLIC_KEY` | Base64 public key (from `auth-service/.env`) |
| `JWT_ACCESS_EXPIRY` | `15m` |
| `JWT_REFRESH_EXPIRY` | `7d` |
| `BCRYPT_ROUNDS` | `12` |
| `LOGIN_RATE_LIMIT` | `10` |
| `LOGIN_RATE_WINDOW` | `900` |
| `GLOBAL_RATE_LIMIT` | `100` |
| `GLOBAL_RATE_WINDOW` | `60` |

### 3. Run Migrations on Neon (one time)

```bash
cd auth-service
DATABASE_URL="your-neon-url" npx prisma migrate deploy
DATABASE_URL="your-neon-url" npx ts-node prisma/seed.ts
```

### 4. Deploy Orders Service

```bash
cd orders-service
vercel --prod
```

In the Vercel dashboard → **Settings → Environment Variables**, add:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_PUBLIC_KEY` | Same base64 public key as auth-service |
| `AUTH_SERVICE_URL` | `https://your-auth-service.vercel.app` |

### 5. Verify Vercel Deployment

```bash
curl https://your-auth-service.vercel.app/health    # → {"status":"ok"}
curl https://your-orders-service.vercel.app/health  # → {"status":"ok"}
```

**Swagger UI:**
- Auth Service: `https://your-auth-service.vercel.app/api-docs`
- Orders Service: `https://your-orders-service.vercel.app/api-docs`

---

## 🧪 First Login After Any Deployment

Once services are running (any option):

### Seeded Test Credentials

| Role | Email | Password | Permissions |
|---|---|---|---|
| Admin | `admin@example.com` | `Admin@1234` | Full access |
| Manager | `manager@example.com` | `Manager@1234` | orders:read/write/delete |
| User | `user@example.com` | `User@1234` | orders:read only |

### Quick Test via curl

```bash
# 1. Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@1234"}'

# 2. Copy the accessToken, then test a protected route
curl http://localhost:3002/orders \
  -H "Authorization: Bearer <accessToken>"
```

---

## 🗺️ Environment Variable Reference

### Auth Service

| Variable | Required | Description |
|---|---|---|
| `PORT` | ✅ | HTTP port (default: 3001) |
| `NODE_ENV` | ✅ | `development` or `production` |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis connection string |
| `JWT_PRIVATE_KEY` | ✅ | Base64 RSA private key |
| `JWT_PUBLIC_KEY` | ✅ | Base64 RSA public key |
| `JWT_ACCESS_EXPIRY` | ✅ | Access token TTL (e.g. `15m`) |
| `JWT_REFRESH_EXPIRY` | ✅ | Refresh token TTL (e.g. `7d`) |
| `BCRYPT_ROUNDS` | ✅ | Password hash cost (12 for prod) |
| `LOGIN_RATE_LIMIT` | ✅ | Max login attempts per window |
| `LOGIN_RATE_WINDOW` | ✅ | Rate limit window in seconds |
| `GLOBAL_RATE_LIMIT` | ✅ | Max requests per IP per window |
| `GLOBAL_RATE_WINDOW` | ✅ | Global window in seconds |

### Orders Service

| Variable | Required | Description |
|---|---|---|
| `PORT` | ✅ | HTTP port (default: 3002) |
| `NODE_ENV` | ✅ | `development` or `production` |
| `JWT_PUBLIC_KEY` | ✅ | Same public key as auth-service |
| `AUTH_SERVICE_URL` | ✅ | Auth service base URL |

---

## ⚠️ Common Issues

| Issue | Cause | Fix |
|---|---|---|
| `401 Unauthorized` on Orders Service | JWT keys mismatch | Ensure `JWT_PUBLIC_KEY` is identical in both services |
| `500` on startup | Empty `DATABASE_URL` or `REDIS_URL` | Fill in both env vars and restart |
| `P1001` Prisma error | Cannot reach database | Check Neon connection string + `?sslmode=require` |
| Redis TLS error | Wrong URL scheme | Use `rediss://` (double s) for Upstash |
| Docker: service not healthy | Another process using port 3001/3002 | Run `docker-compose down` and confirm no other processes |
