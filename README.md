# AssetFlow — Enterprise Asset Management

AssetFlow is a full-stack enterprise asset management system built for the Odoo Hackathon. It covers the full lifecycle of a company's physical assets — registration, allocation, transfers, resource booking, maintenance, and analytics — with a predictive-maintenance layer powered by a separate ML service.

**Team:** Anjali · Somya · Radhika · Shreya

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 19 + Vite, React Router, Tailwind CSS, lucide-react |
| Backend API | Node.js + Express, PostgreSQL (via `pg`), JWT auth |
| Database | PostgreSQL (hosted on Neon) |
| ML Service | Python + FastAPI, scikit-learn (predictive maintenance, idle detection, retirement scoring) |

## Project structure

```
odoo_hackathon/
├── frontend/          React app (Vite) — the AssetFlow UI
├── Backend/           Express API — auth, assets, bookings, transfers, allocations, maintenance, analytics proxy
├── fastapi_app/        FastAPI ML service — Screen 9 predictive analytics
├── ML/                 Model training notebooks, trained model artifacts, and source data
└── README.md           This file
```

Three services run independently and talk to each other over HTTP:

```
Browser  →  frontend (Vite, :5183)
              ↓ REST + JWT
            Backend (Express, :5000)
              ↓ SQL                    ↓ REST (server-to-server)
            PostgreSQL (Neon)        fastapi_app (FastAPI, :8000)
```

The frontend **never** calls the ML service directly — every request goes through the Express backend, which proxies `/api/analytics/*` to the FastAPI service. This keeps auth, CORS, and error handling in one place.

## Features

- **Auth** — signup/login with JWT, role-based access (`EMPLOYEE`, `DEPT_HEAD`, `ASSET_MANAGER`, `ADMIN`), admin-only role/department promotion
- **Dashboard** — live KPI cards (available/allocated/at-risk assets, bookings, transfers, returns) and a recent-activity feed sourced from the audit log
- **Asset Directory** — searchable/filterable asset list, CSV export/import, asset registration with auto-generated `AF-XXXX` tags
- **Organization Setup** — manage departments, asset categories, and employees (roles/department assignment) in one place
- **Resource Booking** — calendar-style booking for shared resources (rooms, equipment) with overlap validation, cancel/reschedule, and upcoming-slot reminders
- **Allocation & Transfer** — allocate an available asset to an employee, or submit a transfer request to move an already-allocated asset to someone else, with full history
- **Maintenance** — raise and track maintenance tickets through their full lifecycle (`PENDING` → `APPROVED`/`REJECTED` → `TECHNICIAN_ASSIGNED` → `IN_PROGRESS` → `RESOLVED`)
- **Reports & Analytics** — department utilization, a weekly booking heatmap, most-used/idle assets, retirement candidates, and predictive maintenance risk scores — all powered by the trained ML models
- **Dark mode** — persisted, system-aware, applied consistently across every screen

## Getting started

You need three terminals — one per service.

### 1. Database

The app expects a PostgreSQL database with the AssetFlow schema already applied (departments, users, assets, categories, allocations, bookings, transfer_requests, maintenance_requests, audit_logs). This project currently points at a shared Neon instance — ask a teammate for the connection string.

### 2. Backend (Express API)

```bash
cd Backend
npm install
```

Create `Backend/.env`:

```env
DATABASE_URL=postgresql://<your-connection-string>
JWT_SECRET=<any-random-string>
PORT=5000
ML_API_BASE_URL=http://127.0.0.1:8000
ADMIN_EMAIL=admin@assetflow.com
ADMIN_PASSWORD=<choose-a-password>
```

```bash
node database/seed.js   # creates/updates the admin account from ADMIN_EMAIL/ADMIN_PASSWORD
npm start                # or: npm run dev (nodemon)
```

Runs on **http://localhost:5000**. Health check: `GET /health`.

### 3. ML service (FastAPI)

```bash
cd fastapi_app
pip install -r requirements.txt
python -m uvicorn main:app --port 8000
```

Runs on **http://127.0.0.1:8000**. Swagger docs at `/docs`. This must be running for the Reports & Analytics page's charts to load — if it's down, the backend returns a clear "analytics service unavailable" error instead of a crash.

### 4. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

```bash
npm run dev
```

Runs on **http://localhost:5183** (or whatever port Vite picks — check the terminal output). Log in with the admin credentials from step 2, or sign up a new employee account from the login screen.

## API overview

All endpoints are prefixed with the backend's base URL (`http://localhost:5000` in dev) and, except where noted, require `Authorization: Bearer <token>`.

| Resource | Endpoints |
|---|---|
| **Auth** (`/api/auth`) | `POST /signup`, `POST /login`, `POST /forgot-password` (public) · `GET /me` · `GET /users` (admin) · `PATCH /users/:id/promote` (admin) |
| **Dashboard** (`/api/dashboard`) | `GET /stats` |
| **Assets** (`/api/assets`) | `GET /`, `GET /summary`, `GET /categories`, `POST /categories`, `GET /departments`, `POST /departments`, `PATCH /departments/:id/status`, `POST /` |
| **Bookings** (`/api/bookings`) | `GET /resources`, `GET /mine`, `GET /?assetId&date`, `POST /`, `PATCH /:id/cancel`, `PATCH /:id` |
| **Allocations** (`/api/allocations`) | `POST /` |
| **Transfers** (`/api/transfers`) | `GET /:assetId`, `POST /` |
| **Maintenance** (`/api/maintenance`) | `GET /`, `POST /`, `PATCH /:id` (admin/asset manager) |
| **Analytics** (`/api/analytics`) | `GET /screen9`, `GET /screen9/idle-assets`, `GET /screen9/retirement-candidates`, `GET /screen9/booking-heatmap`, `GET /screen9/department-utilization` (proxied to the ML service) |


