# Full-Stack Application

## Project Structure
```
├── frontend/        React + Vite + TypeScript
├── backend/         Fastify + TypeScript API
├── db/              Database migrations and seeds
├── docker-compose.yml
└── README.md
```

## Quick Start (Docker)
```bash
cp backend/.env.example backend/.env   # edit DB/JWT values
docker-compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001/api
- Health: http://localhost:8001/api/health

## Local Development

### Backend
```bash
cd backend
npm install
cp .env.example .env    # edit values
npm run dev             # starts on port 8001
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev             # starts on port 3000
```

## Database
```bash
# Run migrations (PostgreSQL)
psql $DATABASE_URL < db/migrations/001_init.sql
psql $DATABASE_URL < db/migrations/002_seed.sql
```

## Changelog

- 2026-05-28T11:51:52.084Z — Pipeline `6a182c42da1c7df65114c103` (v1) stage `frontend_generator`
  - Files generated/updated in this stage: 16
