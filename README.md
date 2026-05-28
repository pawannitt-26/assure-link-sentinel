# AssureLink Guardian

Compliance monitoring platform — React frontend + Fastify API + PostgreSQL.

Reference template for a **monorepo with two Railway services + managed Postgres**.

## Project layout (conventions)

Each deployable service is **self-contained** in its own directory:

```
assure-link-sentinel/
├── backend/                 # API service (Railway Root Directory: backend)
│   ├── Dockerfile           # Build context = this folder
│   ├── railway.toml         # Railway config for backend service
│   ├── migrations/          # SQL schema + seed (owned by backend)
│   ├── src/
│   └── package.json
├── frontend/                # Static UI (Railway Root Directory: frontend)
│   ├── Dockerfile
│   ├── railway.toml
│   ├── nginx.conf.template
│   └── src/
├── docker-compose.yml       # Local dev only (frontend + backend)
├── .env.example             # Local Docker env template
└── package.json             # npm workspaces root
```

**Why not a root-level `railway.toml`?**

Railway resolves config from each service's **Root Directory**. Co-locating `railway.toml` + `Dockerfile` inside `backend/` and `frontend/` means:

- Same pattern for every service
- Docker build context stays inside the service folder (no `COPY ../` hacks)
- Migrations live with the service that runs them
- Easy to copy either folder as a starting point for new services

---

## Deploy to Railway

Create **one Railway project** with three services: **Postgres**, **Backend**, **Frontend**.

### 1. Postgres

Add the **PostgreSQL** template. Railway provides `DATABASE_URL`.

### 2. Backend service

| Setting | Value |
|---------|--------|
| **Root Directory** | `backend` |
| **Config as code** | `backend/railway.toml` (auto-detected) |

**Runtime variables:**

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `JWT_SECRET` | long random string (16+ chars) |
| `FRONTEND_URL` | `https://<your-frontend>.up.railway.app` |
| `RUN_MIGRATIONS` | `true` |
| `NODE_ENV` | `production` |

Generate a **public domain** → e.g. `https://assurelink-api.up.railway.app`

Migrations in `backend/migrations/` run automatically on startup.

### 3. Frontend service

| Setting | Value |
|---------|--------|
| **Root Directory** | `frontend` |
| **Config as code** | `frontend/railway.toml` (auto-detected) |

**Build variable** (enable **Available at Build Time**):

| Variable | Value |
|----------|--------|
| `VITE_API_URL` | `https://<your-backend>.up.railway.app` |

Generate a **public domain** for the frontend.

### 4. CORS

Set backend `FRONTEND_URL` to the exact frontend URL, then redeploy backend.

### 5. Verify

- `https://<backend>/api/health`
- `https://<frontend>/` → login with `demo@example.com` / `demo123`

---

## Local Docker (Railway Postgres)

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3000 (nginx proxies `/api` → backend)
- Backend: http://localhost:8001/api
- Leave `VITE_API_URL` empty in `.env`

---

## Local development (no Docker)

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm install
npm run dev
```

---

## Environment reference

| Variable | Service | When | Description |
|----------|---------|------|-------------|
| `DATABASE_URL` | Backend | Runtime | PostgreSQL connection string |
| `JWT_SECRET` | Backend | Runtime | Auth token secret |
| `FRONTEND_URL` | Backend | Runtime | CORS origin (frontend URL) |
| `RUN_MIGRATIONS` | Backend | Runtime | Auto-run `backend/migrations/*.sql` |
| `VITE_API_URL` | Frontend | Build | Backend public URL (Railway). Empty for local Docker. |
| `BACKEND_PROXY` | Frontend | Runtime | Docker Compose only (`http://backend:8001`) |

---

## Manual migrations (optional)

```bash
psql "$DATABASE_URL" -f backend/migrations/001_init.sql
psql "$DATABASE_URL" -f backend/migrations/002_seed.sql
```
