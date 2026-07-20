# UniNest — Student Accommodation Platform

A production-ready, Airbnb-inspired platform for booking student accommodation worldwide.
Combines the best of AmberStudent, UniAcco, uhomes, and Vita Student with a modern Airbnb-like UX.

> This repository is a **full-stack monorepo** containing a FastAPI backend, a React + TypeScript
> frontend, background workers, and complete infrastructure/deployment configuration.

---

## Table of Contents

1. [Feature Modules](#feature-modules)
2. [Tech Stack](#tech-stack)
3. [Monorepo Structure](#monorepo-structure)
4. [Quick Start](#quick-start)
5. [Documentation Index](#documentation-index)
6. [Environment Variables](#environment-variables)

---

## Feature Modules

| # | Module | Status |
|---|--------|--------|
| 1 | Landing Page (hero search, trending, featured, universities, offers, testimonials, blogs, FAQs) | ✅ Implemented |
| 2 | Advanced Search (30+ filters, sorting, server-side filtering) | ✅ Implemented |
| 3 | Property Listing (gallery, 360/video tours, floor plans, map, nearby POIs, policies, reviews) | ✅ Implemented |
| 4 | Room Types (shared, private, ensuite, studio, apartment, entire house, twin/triple) | ✅ Implemented |
| 5 | Booking (live inventory, coupons, deposits, agreements, invoices, refunds) | ✅ Implemented |
| 6 | Student Dashboard | ✅ Implemented |
| 7 | Host Dashboard | ✅ Implemented |
| 8 | Admin Dashboard | ✅ Implemented |
| 9 | Messaging (real-time chat, typing, read receipts, file sharing) | ✅ Implemented |
| 10 | Reviews & Ratings | ✅ Implemented |
| 11 | Property Verification | ✅ Implemented |
| 12 | Maps & Nearby POIs | ✅ Implemented |
| 13 | AI Features (NL search, recommendations, chatbot) | ✅ Implemented |
| 14 | Notifications (Email, SMS, WhatsApp, Push) | ✅ Implemented |
| 15 | Security (JWT, refresh, RBAC, rate limiting, audit logs) | ✅ Implemented |
| 16 | Performance (pagination, caching, CDN, infinite scroll) | ✅ Implemented |
| 17 | Future Features (roommate matching, split rent, marketplace, loyalty, etc.) | 🧩 Scaffolded |

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full breakdown.

---

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, TailwindCSS, TanStack React Query, React Router, Framer Motion, Google Maps
**Backend:** FastAPI, SQLAlchemy 2.0, Pydantic v2, PostgreSQL, Redis, Celery
**Storage:** Cloudinary (images/video/tours)
**Auth:** JWT access + refresh tokens, Google OAuth 2.0, Role-Based Access Control
**Notifications:** SMTP/SendGrid (email), Twilio (SMS/WhatsApp), Web Push (VAPID)
**AI:** Pluggable LLM provider for natural-language search → structured filters, recommendations, chatbot
**Infra:** Docker, docker-compose, GitHub Actions CI/CD, Nginx, deployable to any container platform

---

## Monorepo Structure

```
Project/
├── server/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # Route handlers (v1)
│   │   ├── core/          # Config, security, deps, rate limiting
│   │   ├── db/            # Session, base, seed
│   │   ├── models/        # SQLAlchemy models (the DB schema)
│   │   ├── schemas/       # Pydantic request/response models
│   │   ├── services/      # Business logic (auth, booking, search, AI, payments)
│   │   ├── workers/       # Celery app + tasks
│   │   └── main.py        # App factory
│   ├── alembic/           # Migrations
│   ├── tests/             # Pytest suite
│   ├── pyproject.toml
│   └── Dockerfile
├── client/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── api/           # API client + React Query hooks
│   │   ├── components/    # Reusable UI components
│   │   ├── features/      # Feature modules (landing, search, property, booking...)
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # Shared hooks
│   │   ├── lib/           # Utilities
│   │   └── types/         # Shared TS types
│   ├── package.json
│   └── Dockerfile
├── infra/                  # Nginx, deployment manifests
├── docs/                   # Architecture, API, DB, flows, wireframes
├── docker-compose.yml      # Full local stack
└── .github/workflows/      # CI/CD
```

---

## Quick Start

### Option A — Docker (recommended)

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
docker compose up --build
```

- Frontend: http://localhost:5173
- API + Swagger docs: http://localhost:8000/docs
- Postgres: localhost:5432, Redis: localhost:6379

### Option B — Local dev

```bash
# Backend
cd server
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head
python -m app.db.seed          # optional demo data
uvicorn app.main:app --reload

# Worker (separate shell)
celery -A app.workers.celery_app worker -B --loglevel=info

# Frontend
cd client
npm install
npm run dev
```

---

## Documentation Index

| Doc | Contents |
|-----|----------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture, deployment topology, ER diagram, all flows, module mapping |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Full schema description + raw SQL DDL |
| [`docs/API.md`](docs/API.md) | REST API reference (endpoints, payloads) |
| [`docs/WIREFRAMES.md`](docs/WIREFRAMES.md) | ASCII wireframes + UI design system |
| [`docs/TESTING.md`](docs/TESTING.md) | Testing strategy (unit, integration, e2e, load) |

---

## Environment Variables

See [`server/.env.example`](server/.env.example) and [`client/.env.example`](client/.env.example)
for the full annotated list. All secrets are read from the environment — nothing is hard-coded.
