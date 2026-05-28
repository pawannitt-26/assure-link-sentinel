# AssureLink Guardian

Compliance monitoring platform — React frontend + Fastify API + PostgreSQL.

## Project Structure

```
├── frontend/        React + Vite + TypeScript (Docker)
├── backend/         Fastify + TypeScript API (Docker)
├── db/migrations/   PostgreSQL schema + seed data (auto-applied on startup)
├── docker-compose.yml
└── README.md
```

## Quick Start (Docker + Railway Postgres)

### 1. Create a Postgres database on Railway

In your [Railway](https://railway.app) project, add a **PostgreSQL** service and copy the **DATABASE_URL** from the Connect tab.

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your Railway `DATABASE_URL` and a strong `JWT_SECRET`.

### 3. Start frontend + backend in Docker

```bash
docker compose up --build
```

On first startup, the backend automatically runs SQL files from `db/migrations/` against your Railway database (schema + seed data).

- Frontend: http://localhost:3000
- Backend API: http://localhost:8001/api
- Health: http://localhost:8001/api/health

**Demo login:** `demo@example.com` / `demo123`

## Environment

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Railway PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing auth tokens (min 16 chars) |
| `RUN_MIGRATIONS` | Run `db/migrations/*.sql` on startup (default `true`) |
| `FRONTEND_URL` | Allowed CORS origin (default `http://localhost:3000`) |
| `VITE_API_URL` | Backend URL for the frontend (leave empty in Docker to use `/api`) |

## Local Development (without Docker)

```bash
cp backend/.env.example backend/.env   # set Railway DATABASE_URL
cp frontend/.env.example frontend/.env

npm install
npm run dev
```

Migrations run automatically when the backend starts (same as Docker).

## Manual migrations (optional)

Normally not needed — the backend handles this. To run manually:

```bash
psql "$DATABASE_URL" -f db/migrations/001_init.sql
psql "$DATABASE_URL" -f db/migrations/002_seed.sql
```
