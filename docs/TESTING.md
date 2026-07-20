# UniNest — Testing Strategy

A layered pyramid: many fast unit tests, fewer integration tests, a thin e2e layer, plus
targeted load and security testing.

## 1. Backend

### Unit (pytest)
- Pure logic: JWT encode/decode, password hashing, AI NL parser, coupon math, refund policy,
  availability computation, distance/commute helpers.
- No DB or network — fast, runs on every commit.
- Included examples: `server/tests/test_security.py`, `server/tests/test_ai_search.py`.

### Integration (pytest + Postgres + Redis services)
- Spin up ephemeral Postgres/Redis (see `.github/workflows/ci.yml`).
- Cover: auth flow (register→login→refresh→logout), search filters + facets,
  booking flow (quote→create→inventory decrement→confirm→cancel/refund), RBAC on admin/host routes,
  review aggregation, idempotent booking under retries.
- Use `TestClient` (`server/tests/conftest.py`) and a transactional fixture that rolls back per test.

### Contract
- Snapshot `/openapi.json` and fail CI on breaking changes; generate the frontend API types from it.

Run:
```bash
cd server && pytest --cov=app --cov-report=term-missing
```

## 2. Frontend

### Unit / Component (Vitest + React Testing Library)
- Utilities (`money`, `cx`), hooks, and components (PropertyCard, FilterSidebar, HeroSearch).
- Mock the API layer with MSW (Mock Service Worker).

### Type safety
- `tsc -b` in CI is a first-class gate (strict mode on).

Run:
```bash
cd client && npm run test && npx tsc -b
```

## 3. End-to-End (Playwright)
Critical user journeys against a seeded staging stack:
1. Search → open listing → wishlist → sign up → book → see confirmation.
2. Host: create property → add rooms → submit → admin approves → it appears in search.
3. Messaging: student ↔ host real-time exchange with read receipts.
4. AI search: NL query resolves to correct filters and results.

## 4. Load & Performance (k6 / Locust)
- Search endpoint at target RPS with cache hit/miss ratios.
- Booking concurrency test: N clients race for the last unit → exactly one succeeds (no oversell).
- Assert p95 latency budgets and error-rate SLOs.

## 5. Security
- Automated: `pip-audit`/`npm audit`, Trivy image scan (in CI), Bandit/ruff security rules.
- Manual/periodic: auth & RBAC bypass attempts, rate-limit verification, file-upload validation,
  IDOR checks on `/{id}` routes, JWT tampering, SQL-injection via ORM parameterisation review.

## 6. Coverage & Gates
- Target ≥ 80% backend line coverage on business logic.
- CI must pass lint + typecheck + unit + integration before image build; e2e gates staging→prod.

## CI Mapping
See [`.github/workflows/ci.yml`](../.github/workflows/ci.yml): `backend` (lint+test),
`frontend` (typecheck+build), `images` (build+Trivy), `deploy-staging` → `e2e` →
`deploy-production` (manual approval).
