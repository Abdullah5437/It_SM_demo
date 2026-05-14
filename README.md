# I-ITSM (Monorepo)

Internal IT Services Management System for IT service providers managing CRM, catalog, billing, inventory, and subscriptions.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB + Mongoose
- **Queue**: BullMQ
- **Cache/Queue Transport**: Redis (optional in local dev)
- **Frontend**: Next.js + React + TypeScript
- **Shared Package**: Zod schemas, TypeScript types, utilities

## Repository Layout

```text
.
├── apps/
│   ├── api/                 # Express API (TypeScript)
│   └── web/                 # Next.js frontend
├── packages/
│   └── shared/              # Shared schemas/types/utils
├── infra/
│   └── docker-compose.yml   # Infra-only compose (Mongo/Redis)
├── docker-compose.yml       # Full local stack (Mongo/Redis/Mailhog)
└── docs/
```

## Prerequisites

- Node.js 18+
- npm 9+
- Docker Desktop (optional but recommended)

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy environment template:

```powershell
Copy-Item .env.example .env
```

3. Choose local mode:

- **Mode A (no Redis, recommended for local API coding):** keep `JOBS_ENABLED=false` in `.env`
- **Mode B (with Redis/BullMQ workers):** set `JOBS_ENABLED=true` and run docker services

4. Optional infrastructure startup:

```powershell
docker compose up -d
```

5. Run development (all workspaces):

```powershell
npm run dev
```

## Local Ports (Important)

By default, both API and web can try to use port `3000`.

For running both together via `npm run dev`, set these in `.env`:

```dotenv
PORT=3001
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

Then:

- Web runs on `http://localhost:3000` (`next dev --turbo`)
- API runs on `http://localhost:3001`

## Environment Notes

Key variables in `.env`:

- `MONGO_URI`
- `PORT`
- `JWT_SECRET`
- `JOBS_ENABLED` (`false` by default in development)
- `REDIS_URL` (required only when `JOBS_ENABLED=true`)

When `JOBS_ENABLED=false`:

- Redis connection is skipped
- BullMQ queue initialization is skipped
- Workers and cron trigger startup are skipped

This allows local API development without Redis.

## Scripts

### Root

```bash
npm run dev
npm run build
npm run test
npm run check-types
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run db:seed
```

Notes:

- `npm run dev` uses Turborepo (`turbo run dev`) for all workspaces.
- `npm run check-types` currently checks referenced TS projects from root (`apps/api`, `packages/shared`).

### API (`apps/api`)

```bash
npm run dev
npm run build
npm run start
npm run test
npm run test:watch
npm run lint
npm run lint:fix
npm run db:seed
```

### Web (`apps/web`)

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run lint:fix
```

Note: Web dev runs with `next dev --turbo` (set in `apps/web/package.json`).

### Shared (`packages/shared`)

```bash
npm run build
npm run lint
npm run lint:fix
```

## API Endpoints (Current)

- `GET /health`
- `GET /api/v1/status`
- `POST /api/v1/auth/login` (placeholder)
- `GET /api/v1/auth/me`
- `/api/v1/clients/*`
- `/api/v1/catalog/*`
- `/api/v1/billing/*`
- `/api/v1/inventory/*`
- `/api/v1/subscriptions/*`

## Current Plan Coverage

Implemented modules include:

- Foundation + middleware (auth/audit/error handling)
- CRM + catalog baseline
- Billing + invoice flows
- Inventory baseline
- **Plan 5 (Subscriptions & Recurring Billing)**
  - Subscription model/service/controller/routes
  - Billing/proration/trial/renewal scaffolds
  - BullMQ queue + worker + scheduled trigger
  - Shared schema/type exports

## Testing

```bash
npm run test
```

Notes:

- Some integration tests use MongoDB connections and require a reachable DB.
- Pure unit tests can run independently when written without DB bootstrap dependencies.

## Conventions

- Monetary values are stored as integer cents
- Tax rates are basis points (`bps`)
- API validation uses Zod
- Mutations are audit-logged
- RBAC enforced through middleware on protected routes

## Troubleshooting

### API and web port conflict

If one app fails to start while running `npm run dev`, ensure API is not also on `3000`.
Use:

- `PORT=3001`
- `FRONTEND_URL=http://localhost:3000`

### `ECONNREFUSED 127.0.0.1:6379`

- Set `JOBS_ENABLED=false` for local dev without Redis, or
- Start Redis via Docker and ensure `REDIS_URL` points correctly

### TypeScript path aliases

From root `tsconfig.base.json`:

- `@shared/*` → `packages/shared/src/*`
- `@/*` → `apps/api/src/*`

Use existing import style in nearby files to keep consistency.

## License

Proprietary — Tech Line
