# Copilot Instructions for I-ITSM

## Project Context

- Monorepo with npm workspaces:
  - `apps/api` (Express + TypeScript)
  - `apps/web` (Next.js + TypeScript)
  - `packages/shared` (shared schemas/types/utils)
- Business domain: CRM, catalog, billing, inventory, subscriptions/recurring billing.

## Architecture Rules

- Keep API modules feature-based under `apps/api/src/modules/<feature>`.
- Use layered structure where applicable:
  - `*.model.ts` (Mongoose)
  - `*.service.ts` (business logic)
  - `*.controller.ts` (HTTP orchestration)
  - `*.routes.ts` (routing + middleware)
- Use shared contracts from `@i-itsm/shared` (or `@shared/*` path alias where appropriate).

## API Implementation Standards

- Validate request bodies/queries with Zod schemas from `packages/shared/src/schemas`.
- Enforce auth + RBAC in routes using middlewares from `apps/api/src/middlewares`.
- Record audit logs for all mutating operations (`create`, `update`, `delete`-like actions).
- Return consistent response shape:
  - Success: `{ success: true, data: ... }`
  - Failure via centralized error handler.
- Use UTC-safe date handling and explicit conversions.

## Domain Conventions

- Money fields are integer cents (e.g., `unitPriceCents`, `balanceCents`).
- Tax rates are basis points (`bps`).
- IDs stored as Mongo ObjectIds in persistence; convert/validate safely at boundaries.
- Immutable accounting artifacts should not be rewritten in place.

## Queue/Worker Conventions

- BullMQ is used for background jobs.
- Redis/worker startup is environment-gated by `JOBS_ENABLED`.
  - Local development may run with `JOBS_ENABLED=false` (no Redis dependency).
- Worker code belongs under `apps/api/src/jobs/workers`.
- Keep idempotency in queue jobs (stable `jobId` where possible).

## Testing Expectations

- Prefer unit tests for pure logic in services/helpers.
- Keep integration tests separate and explicit about external dependencies (Mongo/Redis).
- Avoid introducing tests that require Redis unless the test scope is queue behavior.

## TypeScript and Style

- Follow strict TypeScript style already used in the repo.
- Avoid `any`; use explicit interfaces/types.
- Reuse existing utility functions and shared types before introducing new ones.
- Keep edits focused and minimal; do not refactor unrelated code.

## Imports and Paths

- API path aliases from `tsconfig.base.json`:
  - `@/*` → `apps/api/src/*`
  - `@shared/*` → `packages/shared/src/*`
- Also valid workspace package import:
  - `@i-itsm/shared`
- Match the import pattern used in the surrounding file unless there is a clear compile issue.

## Documentation and DX

- When changing runtime behavior, update `README.md` and `.env.example`.
- Whenever code changes are made, update the affected documentation in the same change set. This includes `README.md`, `.env.example`, `.github/plans/*`, and `docs/Implementations/*` whenever behavior, endpoints, configuration, file structure, or implementation status changes.
- Keep local development instructions PowerShell-friendly for Windows contributors.
- If adding new env vars, document defaults and whether they are required.
