# Auth & RBAC System — Documentation Index

This repository contains the following documentation files:

---

## 📄 Files

| File | Purpose |
|---|---|
| **[README.md](./README.md)** | Submission-ready overview — Architecture, RBAC flow, Setup, Env vars, Security decisions |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Full deployment guide for Docker, Manual (Neon + Upstash), and Vercel |
| **[SWAGGER_GUIDE.md](./SWAGGER_GUIDE.md)** | Complete API reference with request/response examples for every endpoint |

---

## ⚡ Quick Reference

### Generate RSA Keys (run once)
```bash
node scripts/generate-keys.js
```

### Docker
```bash
docker-compose up --build
docker exec auth_service npx prisma migrate deploy
docker exec auth_service npx ts-node prisma/seed.ts
```

### Manual (Neon + Upstash)
1. Fill `auth-service/.env` → `DATABASE_URL` and `REDIS_URL`
2. Run `node scripts/generate-keys.js`
3. `cd auth-service && npx prisma migrate dev && npx ts-node prisma/seed.ts && npm run dev`
4. `cd orders-service && npm run dev`

### Vercel
See **[DEPLOYMENT.md → Option C](./DEPLOYMENT.md#option-c--vercel-deployment)**

---

## 🔑 Default Credentials (after seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | Admin@1234 |
| Manager | manager@example.com | Manager@1234 |
| User | user@example.com | User@1234 |

---

## 🌐 Service URLs

| Service | Local URL | Swagger |
|---|---|---|
| Auth Service | http://localhost:3001 | http://localhost:3001/api-docs |
| Orders Service | http://localhost:3002 | http://localhost:3002/api-docs |
