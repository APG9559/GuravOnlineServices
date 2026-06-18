# Family Store — Kolhapur Municipal Services

A full-stack web application for managing **Affidavit/Notary** and **Marriage Registration** records — with price calculation, receipt printing, Excel export, earnings dashboard, and role-based access.

---

## Tech Stack

| Layer    | Technology                               |
|----------|------------------------------------------|
| Frontend | React 18 + TypeScript + Vite + nginx     |
| Backend  | NestJS 10 + TypeScript                   |
| Database | PostgreSQL 16 + TypeORM                  |
| Auth     | JWT (8 h expiry) + bcrypt                |
| Docker   | Multi-stage builds for both services     |

---

## Quick Start (Docker — recommended)

Requires: **Docker Desktop** → https://docker.com

```bash
# 1. Clone / unzip the project
cd family-store

# 2. Copy environment file (defaults work out of the box)
cp .env.example .env

# 3. Build and start all services (postgres + backend + seeder + frontend)
docker compose up --build -d

# 4. Watch logs to see when everything is ready
docker compose logs -f seeder     # seeder prints login credentials, then exits
docker compose logs -f backend    # wait for "Server running on http://localhost:3000"
```

Open **http://localhost** in your browser.

> The seeder runs automatically and prints login credentials to its logs.

---

## Default Login Credentials

| Role     | Email                         | Password       |
|----------|-------------------------------|----------------|
| Admin    | admin@familystore.local       | Admin@1234     |
| Operator | operator@familystore.local    | Operator@1234  |

> ⚠️ **Change these passwords** after first login via the **Users** page (Admin only).

---

## Local Development (without Docker)

### Prerequisites
- Node.js v18+ — https://nodejs.org
- PostgreSQL running locally (or use `docker compose up postgres -d`)

### Steps

```bash
# Install all dependencies
npm run install:all

# Start postgres only (if not already running)
docker compose up postgres -d

# Seed the database (creates default users)
npm run seed

# Start backend + frontend in parallel
npm run dev
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:5173        |
| Backend  | http://localhost:3000        |
| Swagger  | http://localhost:3000/api/docs |

### Backend only
```bash
cd backend
cp .env.example .env     # edit if needed
npm install
npm run seed             # create default users
npm run start:dev        # watch mode
```

### Frontend only
```bash
cd frontend
npm install
npm run dev
```

---

## Useful Docker Commands

```bash
# Start everything
docker compose up -d

# Rebuild after code changes
docker compose up --build -d

# View logs
docker compose logs -f              # all services
docker compose logs -f backend      # backend only
docker compose logs -f seeder       # see seed output / credentials

# Stop everything
docker compose down

# Stop + delete database (fresh start)
docker compose down -v

# Re-run seeder manually (e.g. after docker compose down -v)
docker compose run --rm seeder
```

---

## Project Structure

```
family-store/
├── .env.example               Root env for docker-compose
├── docker-compose.yml         All 4 services: postgres, backend, seeder, frontend
├── package.json               Root convenience scripts
│
├── backend/
│   ├── Dockerfile             Multi-stage production image
│   ├── Dockerfile.seed        Lightweight image just for seeding
│   ├── .env.example           Backend env vars
│   └── src/
│       ├── auth/              JWT login + strategy
│       ├── users/             User CRUD (admin only)
│       ├── affidavits/        Affidavit module (entity, DTO, service, controller)
│       ├── marriages/         Marriage module
│       ├── dashboard/         Earnings summary API
│       ├── common/            Guards, decorators, enums, pricing constants
│       └── database/
│           └── seed.ts        Creates default admin + operator accounts
│
└── frontend/
    ├── Dockerfile             Multi-stage: Vite build → nginx
    ├── nginx.conf             Serves React app + proxies /api to backend
    ├── .env.example
    └── src/
        ├── pages/             Login, Dashboard, Affidavits, Marriages, Records, Users
        ├── components/        Layout, PriceCalculator, Receipt (printable)
        ├── api/               Axios client with JWT interceptor
        ├── context/           AuthContext (login state)
        └── types/             Shared TypeScript types + pricing constants
```

---

## Pricing Reference

### Affidavit / Notary

| Parameter            | Cost    |
|----------------------|---------|
| ₹500 Stamp paper     | ₹500    |
| Plain paper          | ₹0      |
| Executive Magistrate | ₹850    |
| Notary Public        | ₹1,100  |

**Example:** Stamp paper + Notary Public = ₹500 + ₹1,100 = **₹1,600**

### Marriage Registration

| Service              | Cost    |
|----------------------|---------|
| Online form filling  | ₹300    |
| Offline form filling | ₹300    |
| Document true copy   | ₹100    |
| + Affidavit (1 per couple) | see above |

---

## User Roles

| Role         | Can do                                                                 |
|--------------|------------------------------------------------------------------------|
| **Admin**    | Add, edit, delete records; manage users; export Excel; print receipts  |
| **Operator** | Add, edit records; view all; export Excel; print receipts — no delete, no user management |

---

## Features

- **Price calculator** — instant breakdown before adding a record
- **Audit trail** — every record stores who created/modified it and when
- **Soft delete** — records are hidden but never permanently lost
- **Edit records** — correct mistakes after saving
- **Search & filter** — by name, phone, and date range
- **Excel export** — one-click `.xlsx` download for any filtered view
- **Receipt printing** — formatted customer receipt for any record
- **Dashboard** — live counts + earnings summary with date range filter
- **User management** — Admin can create, edit, deactivate staff accounts

---

## Adding More Service Modules

The codebase is modular. To add the next service (e.g. Trade License, PAN Card):

**Backend:**
1. `cp -r backend/src/affidavits backend/src/trade-license` and adapt entity/DTO/service/controller
2. Register the new module in `app.module.ts`

**Frontend:**
1. Create `frontend/src/pages/TradeLicense.tsx` (copy Affidavits.tsx as template)
2. Add route in `App.tsx`
3. Add nav link in `components/Layout/Layout.tsx`

---

## Production Deployment (Railway / Render / VPS)

1. Set all env vars from `.env.example` on your host
2. Change `JWT_SECRET` to a long random string
3. Set `FRONTEND_URL` to your actual frontend domain (for CORS)
4. Run `docker compose up --build -d` on the server
5. Point your domain DNS to the server IP — frontend is on port 80

