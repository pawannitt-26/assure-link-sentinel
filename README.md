# AssureLink Guardian

Compliance monitoring platform — React frontend + Fastify API + PostgreSQL.

Deployed on Railway as **three services**: `db` (Postgres), `api` (backend), `web` (frontend).

## Project layout

```
assure-link-sentinel/
├── backend/                 # api service (Railway Root Directory: backend)
│   ├── Dockerfile
│   ├── railway.toml
│   ├── migrations/          # SQL schema + seed
│   ├── package.json
│   ├── package-lock.json
│   └── src/
├── frontend/                # web service (Railway Root Directory: frontend)
│   ├── Dockerfile
│   ├── railway.toml
│   ├── nginx.conf           # static SPA only — no /api proxy
│   ├── package.json
│   ├── package-lock.json
│   └── src/
│       └── lib/api.ts       # VITE_API_URL helper (Strategy A)
├── docker-compose.yml       # local dev only
├── .env.example
└── package.json             # npm workspaces (local dev)
```

## Railway deploy

### 1. db — Postgres

Add the **PostgreSQL** plugin. Railway provides `DATABASE_URL`.

### 2. api — Backend

| Setting | Value |
|---------|--------|
| **Service name** | `api` |
| **Root Directory** | `backend` |

**Runtime variables:**

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `JWT_SECRET` | long random string (16+ chars) |
| `FRONTEND_URL` | `https://<web>.up.railway.app` |
| `CORS_ORIGINS` | `https://<web>.up.railway.app` |
| `RUN_MIGRATIONS` | `true` |
| `PORT` | `8080` |
| `NODE_ENV` | `production` |

Health check: `GET /api/health`

### 3. web — Frontend

| Setting | Value |
|---------|--------|
| **Service name** | `web` |
| **Root Directory** | `frontend` |

**Build variable** (enable **Available at Build Time**):

| Variable | Value |
|----------|--------|
| `VITE_API_URL` | `https://<api>.up.railway.app` |

The frontend calls the API via `VITE_API_URL` only — nginx serves static files on port 8080 with no `/api` proxy.

### 4. CORS

Set `CORS_ORIGINS` and `FRONTEND_URL` on **api** to the exact **web** URL, then redeploy api.

### 5. Verify

- `https://<api>/api/health`
- `https://<web>/` → login with `demo@example.com` / `demo123`

---

## Local Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

- **web**: http://localhost:5173
- **api**: http://localhost:8080/api
- `VITE_API_URL=http://localhost:8080` is passed at web build time

---

## Local development (no Docker)

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env   # optional; omit VITE_API_URL to use Vite proxy
npm install
npm run dev
```

- **web** (Vite): http://localhost:5173 — proxies `/api` → http://localhost:8080
- **api**: http://localhost:8080/api

---

## Environment reference

| Variable | Service | When | Description |
|----------|---------|------|-------------|
| `DATABASE_URL` | api | Runtime | PostgreSQL connection string |
| `JWT_SECRET` | api | Runtime | Auth token secret |
| `FRONTEND_URL` | api | Runtime | Web public URL |
| `CORS_ORIGINS` | api | Runtime | Allowed CORS origins (comma-separated) |
| `PORT` | api | Runtime | Listen port (default `8080`) |
| `HOST` | api | Runtime | Bind address (default `0.0.0.0`) |
| `RUN_MIGRATIONS` | api | Runtime | Auto-run `backend/migrations/*.sql` |
| `VITE_API_URL` | web | Build | API public URL (required on Railway) |

---

## Manual migrations (optional)

```bash
psql "$DATABASE_URL" -f backend/migrations/001_init.sql
psql "$DATABASE_URL" -f backend/migrations/002_seed.sql
```
