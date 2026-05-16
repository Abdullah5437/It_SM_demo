# Plan 1: Foundation & Infrastructure

**Priority**: P0  
**Duration**: ~2-3 weeks  
**Dependencies**: None (foundational)

## Overview
Establish the core monorepo structure, database setup, authentication framework, and infrastructure that all other plans depend on.

---

## Deliverables

### 1. Monorepo Structure
- [ ] Create `/apps/api` (Express backend)
- [ ] Create `/apps/web` (React/Next.js frontend)
- [ ] Create `/packages/shared` (shared types, zod schemas, utilities)
- [ ] Create `/infra` (Docker compose, environment samples)
- [ ] Root `package.json` with workspace configuration (yarn/npm workspaces)
- [ ] Shared `tsconfig.json` and `eslint`/`prettier` config

### 2. Database Setup
- [ ] Docker Compose with MongoDB and Redis services
- [ ] Environment file samples (`.env.example`)
- [ ] MongoDB connection utility in `/apps/api/src/config/db.ts`
- [ ] Redis client initialization (generic, for job queues - BullMQ deferred)
- [ ] Database initialization script with default collections and indexes

### 3. Authentication & Authorization
- [ ] User model with password hashing (bcryptjs)
- [ ] JWT token generation and validation middleware
- [ ] RBAC (role-based access control) middleware
- [ ] Login endpoint (`POST /api/v1/auth/login`)
- [ ] Token refresh endpoint (`POST /api/v1/auth/refresh`)
- [ ] Protected route middleware
- [ ] User creation seeding script (admin user)

### 4. Audit Logging Framework
- [ ] Audit log model with schema
- [ ] Audit log middleware to capture mutations (create, update, delete)
- [ ] Fields: `actorUserId`, `entityType`, `entityId`, `action`, `before`, `after`, `ip`, `createdAt`
- [ ] Utility functions to log sensitive actions
- [ ] Audit query endpoints (`GET /api/v1/audit/logs`)

### 5. Error Handling & Validation
- [ ] Global error handler middleware
- [ ] HTTP status code mapper
- [ ] Zod schema validation middleware
- [ ] Request/response logging
- [ ] Custom error classes (ValidationError, AuthError, NotFoundError, etc.)

### 6. Infrastructure & DevOps
- [ ] Docker Compose file with MongoDB, Redis, optional Mailgun/SendGrid mock
- [ ] GitHub Actions CI/CD skeleton (lint, test, build)
- [ ] Environment variable documentation
- [ ] Secrets management strategy (env file + comment on production)
- [ ] Health check endpoint (`GET /health`)

### 7. Base Project Configuration
- [ ] TypeScript configuration for strict mode
- [ ] ESLint and Prettier setup
- [ ] Git hooks (husky) for pre-commit linting
- [ ] `.gitignore` for monorepo
- [ ] README with setup instructions

---

## Key Files to Create

```
/
├── package.json (root workspaces)
├── tsconfig.json
├── tsconfig.base.json
├── .eslintrc.json
├── .prettierrc
├── .env.example
├── docker-compose.yml
├── infra/
│   └── .env.example
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── config/
│   │   │   │   ├── db.ts
│   │   │   │   ├── redis.ts
│   │   │   │   └── env.ts
│   │   │   ├── middlewares/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── rbac.ts
│   │   │   │   ├── audit.ts
│   │   │   │   ├── errorHandler.ts
│   │   │   │   └── validation.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.model.ts
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── auth.routes.ts
│   │   │   │   │   └── auth.schema.ts
│   │   │   │   └── audit/
│   │   │   │       ├── audit.model.ts
│   │   │   │       ├── audit.service.ts
│   │   │   │       └── audit.routes.ts
│   │   │   ├── utils/
│   │   │   │   ├── logger.ts
│   │   │   │   ├── errors.ts
│   │   │   │   └── jwt.ts
│   │   │   └── tests/
│   │   │       └── auth.test.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/
│       ├── src/
│       │   ├── app.tsx
│       │   ├── pages/
│       │   ├── components/
│       │   ├── hooks/
│       │   └── lib/
│       ├── package.json
│       └── tsconfig.json
└── packages/
    └── shared/
        ├── src/
        │   ├── types/
        │   │   ├── common.ts
        │   │   ├── auth.ts
        │   │   └── api.ts
        │   ├── schemas/
        │   │   └── auth.schema.ts
        │   └── utils/
        │       ├── errors.ts
        │       └── formatters.ts
        ├── package.json
        └── tsconfig.json
```

---

## Implementation Checklist

- [ ] Initialize Git repository and commit structure
- [ ] Setup ESLint, Prettier, and TypeScript
- [ ] Create Express app entry point with middleware stack
- [ ] Configure MongoDB connection with Mongoose
- [ ] Configure Redis client for generic queue support (BullMQ deferred to Plan 5)
- [ ] Implement JWT auth flow (login, token generation, refresh)
- [ ] Create RBAC middleware and role definitions
- [ ] Implement audit logging for all mutations
- [ ] Create error handling middleware and custom errors
- [ ] Write unit tests for auth service
- [ ] Create Docker Compose file and verify services start
- [ ] Create `.env.example` and setup guide
- [ ] Create admin seed script
- [ ] Document API versioning strategy (v1)
- [ ] Verify health check endpoint works

---

## Dependencies
- Express.js
- Mongoose + MongoDB
- Redis
- JWT (jsonwebtoken)
- Zod (validation)
- bcryptjs
- BullMQ (deferred to Plan 5)
- Pino (logging)
- TypeScript

---

## Testing Strategy
- Unit tests for JWT generation/validation
- Unit tests for password hashing
- Integration test for login endpoint
- Integration test for protected route with valid/invalid tokens

---

## Definition of Done
- Monorepo structure is established and all workspaces can build
- Health check endpoint returns 200 OK
- Admin user can login and receive JWT token
- Audit logs are recorded for all mutations
- All TypeScript files compile without errors
- Docker Compose brings up MongoDB and Redis successfully
- README documents setup and local development steps
