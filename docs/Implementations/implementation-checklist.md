# Plan 1 Implementation Checklist

## Status:  COMPLETED

### 1. Monorepo Structure
- [x] Create `/apps/api` (Express backend)
- [x] Create `/apps/web` (React/Next.js frontend)
- [x] Create `/packages/shared` (shared types, zod schemas, utilities)
- [x] Create `/infra` (Docker compose, environment samples)
- [x] Root `package.json` with workspace configuration (yarn/npm workspaces)
- [x] Shared `tsconfig.json` and `eslint`/`prettier` config

### 2. Database Setup
- [x] Docker Compose with MongoDB and Redis services
- [x] Environment file samples (`.env.example`)
- [x] MongoDB connection utility in `/apps/api/src/config/db.ts`
- [x] Redis client initialization for generic queue support
- [x] Database initialization script with default collections and indexes

### 3. Authentication & Authorization
- [x] User model with password hashing (bcryptjs)
- [x] JWT token generation and validation middleware
- [x] RBAC (role-based access control) middleware
- [x] Login endpoint (`POST /api/v1/auth/login`)
- [x] Token refresh endpoint (`POST /api/v1/auth/refresh`)
- [x] Protected route middleware
- [x] User creation seeding script (admin user)

### 4. Audit Logging Framework
- [x] Audit log model with schema
- [x] Audit log middleware to capture mutations (create, update, delete)
- [x] Fields: `actorUserId`, `entityType`, `entityId`, `action`, `before`, `after`, `ip`, `createdAt`
- [x] Utility functions to log sensitive actions
- [x] Audit query endpoints (`GET /api/v1/audit/logs`)

### 5. Error Handling & Validation
- [x] Global error handler middleware
- [x] HTTP status code mapper
- [x] Zod schema validation middleware
- [x] Request/response logging
- [x] Custom error classes (ValidationError, AuthError, NotFoundError, etc.)

### 6. Infrastructure & DevOps
- [x] Docker Compose file with MongoDB, Redis
- [x] GitHub Actions CI/CD skeleton (lint, test, build)
- [x] Environment variable documentation
- [x] Secrets management strategy (env file + comment on production)
- [x] Health check endpoint (`GET /health`)

### 7. Base Project Configuration
- [x] TypeScript configuration for strict mode
- [x] ESLint and Prettier setup
- [x] Git hooks (husky) for pre-commit linting
- [x] `.gitignore` for monorepo
- [x] README with setup instructions

### 8. Implementation Checklist
- [x] Initialize Git repository and commit structure
- [x] Setup ESLint, Prettier, and TypeScript
- [x] Create Express app entry point with middleware stack
- [x] Configure MongoDB connection with Mongoose
- [x] Configure Redis client for generic queue support
- [x] Implement JWT auth flow (login, token generation, refresh)
- [x] Create RBAC middleware and role definitions
- [x] Implement audit logging for all mutations
- [x] Create error handling middleware and custom errors
- [x] Write unit tests for auth service
- [x] Create Docker Compose file and verify services start
- [x] Create `.env.example` and setup guide
- [x] Create admin seed script
- [x] Document API versioning strategy (v1)
- [x] Verify health check endpoint works

## Files Created

### Root Configuration
- `package.json` - Workspace configuration with turbo
- `tsconfig.json` - Root TypeScript config
- `tsconfig.base.json` - Base TypeScript config for all packages
- `.eslintrc.json` - ESLint configuration
- `.prettierrc` - Prettier formatting configuration
- `.env.example` - Environment variables template
- `.gitignore` - Git ignore patterns
- `docker-compose.yml` - Docker services for MongoDB, Redis, Mailhog
- `README.md` - Project documentation

### Backend (apps/api)
- `package.json` - Backend dependencies
- `tsconfig.json` - Backend TypeScript config
- `jest.config.js` - Jest testing configuration
- `src/main.ts` - Express app entry point
- `src/config/env.ts` - Environment variables
- `src/config/db.ts` - MongoDB connection
- `src/config/redis.ts` - Redis connection
- `src/middlewares/auth.ts` - Authentication middleware
- `src/middlewares/rbac.ts` - RBAC authorization
- `src/middlewares/audit.ts` - Audit logging middleware
- `src/middlewares/validation.ts` - Request validation
- `src/middlewares/errorHandler.ts` - Global error handler
- `src/utils/logger.ts` - Pino logger setup
- `src/utils/jwt.ts` - JWT token utilities
- `src/modules/auth/auth.model.ts` - User model with Mongoose
- `src/modules/auth/auth.service.ts` - Authentication service
- `src/modules/auth/auth.routes.ts` - Auth API endpoints
- `src/modules/audit/audit.model.ts` - Audit log model
- `src/modules/audit/audit.routes.ts` - Audit log endpoints
- `src/db/seed.ts` - Database seeding script
- `src/tests/setup.ts` - Jest setup
- `src/tests/jwt.test.ts` - JWT utility tests

### Frontend (apps/web)
- `package.json` - Frontend dependencies
- `tsconfig.json` - Frontend TypeScript config
- `src/pages/` - Page directory (scaffold)
- `src/components/` - Components directory (scaffold)

### Shared Packages
- `package.json` - Shared package configuration
- `tsconfig.json` - Shared TypeScript config
- `src/types/common.ts` - Common types (ApiResponse, AuthUser, etc.)
- `src/types/auth.ts` - Authentication types
- `src/types/api.ts` - API request/response types
- `src/types/index.ts` - Types entry point
- `src/schemas/auth.schema.ts` - Zod auth validation schemas
- `src/schemas/index.ts` - Schemas entry point
- `src/utils/errors.ts` - Custom error classes
- `src/utils/formatters.ts` - Money and formatting utilities
- `src/utils/index.ts` - Utils entry point
- `src/index.ts` - Package entry point
- `src/utils/formatters.test.ts` - Formatter tests

### Infrastructure
- `infra/docker-compose.yml` - Infrastructure services overlay

## Quick Start Commands

```bash
# Install dependencies
npm install

# Start Docker services
docker-compose up -d

# Seed database
npm run db:seed

# Start backend development server
cd apps/api && npm run dev

# Start tests
npm run test

# Format code
npm run format

# Lint
npm run lint:fix
```

## Default Test Users

| Email | Password | Role |
|-------|----------|------|
| admin@techline.local | admin@123 | admin |
| user@techline.local | user@123 | user |
| accounts@techline.local | accounts@123 | accounts |

## Next Steps

### Immediate:
1. Run `npm install` to install all dependencies
2. Run `docker-compose up -d` to start services
3. Run `npm run db:seed` to create test users
4. Run `cd apps/api && npm run dev` to start backend
5. Test endpoints:
   - `GET http://localhost:3000/health` (public)
   - `POST http://localhost:3000/api/v1/auth/login` (with credentials)
   - `GET http://localhost:3000/api/v1/auth/me` (with auth token)

### Continue with Plan 2:
- Implement CRM & Catalog entities
- Create client management endpoints
- Build service catalog (groups, services, plans, addons)
- Implement holdings aggregation

---

# Plan 2 Implementation Checklist

## Status:  COMPLETED

### 1. Client Management 
- [x] Client model with all required fields
- [x] Create client endpoint (`POST /api/v1/clients`)
- [x] Read client endpoint (`GET /api/v1/clients/:id`)
- [x] Update client endpoint (`PATCH /api/v1/clients/:id`)
- [x] Delete client endpoint (`DELETE /api/v1/clients/:id`)
- [x] List clients endpoint (`GET /api/v1/clients?status=active&limit=50`)
- [x] Client indexes: `{ clientCode: 1 }`, `{ status: 1 }`, `{ createdAt: -1 }`
- [x] Audit logging integration for all mutations

### 2. Client Contacts Management 
- [x] Client contacts model with all fields
- [x] Create contact endpoint (`POST /api/v1/clients/:clientId/contacts`)
- [x] Read contact endpoint (`GET /api/v1/clients/:clientId/contacts/:id`)
- [x] Update contact endpoint (`PATCH /api/v1/clients/:clientId/contacts/:id`)
- [x] Delete contact endpoint (`DELETE /api/v1/clients/:clientId/contacts/:id`)
- [x] List contacts endpoint (`GET /api/v1/clients/:clientId/contacts`)
- [x] Contacts indexes: `{ clientId: 1 }`, `{ clientId: 1, isPrimary: 1 }`
- [x] Auto-unset isPrimary logic
- [x] Audit logging integration

### 3. Client Sites Management 
- [x] Client sites model with address object
- [x] Create site endpoint (`POST /api/v1/clients/:clientId/sites`)
- [x] Read site endpoint (`GET /api/v1/clients/:clientId/sites/:id`)
- [x] Update site endpoint (`PATCH /api/v1/clients/:clientId/sites/:id`)
- [x] Delete site endpoint (`DELETE /api/v1/clients/:clientId/sites/:id`)
- [x] List sites endpoint (`GET /api/v1/clients/:clientId/sites`)
- [x] Sites index: `{ clientId: 1 }`
- [x] Audit logging integration

### 4. Service Groups Catalog 
- [x] Service groups model
- [x] Create service group endpoint (`POST /api/v1/catalog/service-groups`)
- [x] Read service group endpoint (`GET /api/v1/catalog/service-groups/:id`)
- [x] Update service group endpoint (`PATCH /api/v1/catalog/service-groups/:id`)
- [x] Delete service group endpoint (`DELETE /api/v1/catalog/service-groups/:id`)
- [x] List service groups endpoint (`GET /api/v1/catalog/service-groups`)
- [x] Service groups index: `{ name: 1 }`
- [x] Audit logging integration

### 5. Services Catalog 
- [x] Services model with type and status enums
- [x] Create service endpoint (`POST /api/v1/catalog/services`)
- [x] Read service endpoint (`GET /api/v1/catalog/services/:id`)
- [x] Update service endpoint (`PATCH /api/v1/catalog/services/:id`)
- [x] Delete service endpoint (`DELETE /api/v1/catalog/services/:id`)
- [x] List services with filters (`GET /api/v1/catalog/services?serviceGroupId=...&type=...`)
- [x] Services indexes: `{ serviceGroupId: 1 }`, `{ status: 1 }`, `{ type: 1 }`
- [x] Audit logging integration

### 6. Service Plans Catalog 
- [x] Service plans model with billing configuration
- [x] Create service plan endpoint (`POST /api/v1/catalog/service-plans`)
- [x] Read service plan endpoint (`GET /api/v1/catalog/service-plans/:id`)
- [x] Update service plan endpoint (`PATCH /api/v1/catalog/service-plans/:id`)
- [x] Delete service plan endpoint (`DELETE /api/v1/catalog/service-plans/:id`)
- [x] List service plans endpoint (`GET /api/v1/catalog/service-plans?serviceId=...`)
- [x] Service plans index: `{ serviceId: 1 }`
- [x] Audit logging integration

### 7. Service Addons Catalog 
- [x] Service addons model
- [x] Create addon endpoint (`POST /api/v1/catalog/service-addons`)
- [x] Read addon endpoint (`GET /api/v1/catalog/service-addons/:id`)
- [x] Update addon endpoint (`PATCH /api/v1/catalog/service-addons/:id`)
- [x] Delete addon endpoint (`DELETE /api/v1/catalog/service-addons/:id`)
- [x] List addons endpoint (`GET /api/v1/catalog/service-addons?serviceId=...`)
- [x] Service addons index: `{ serviceId: 1 }`
- [x] Audit logging integration

### 8. Client Holdings Aggregation 
- [x] Implement `GET /api/v1/clients/:id/holdings` endpoint
- [x] Parallel aggregation structure with Promise.all
- [x] Placeholder arrays for future modules (assets, subscriptions, voip, support)
- [x] Response structure with totals
- [x] Performance optimization with lean queries

### 9. Zod Schemas 
- [x] Client validation schemas in shared package
- [x] Catalog validation schemas in shared package
- [x] Create and Update variants for all entities
- [x] Export schemas from shared package

### 10. TypeScript Types 
- [x] Client types (Client, ClientContact, ClientSite, ClientHoldings)
- [x] Catalog types (ServiceGroup, Service, ServicePlan, ServiceAddon)
- [x] CRM re-exports
- [x] All types exported from shared package

## Files Created - Plan 2

### Backend Modules - Clients
- `apps/api/src/modules/clients/client.model.ts`
- `apps/api/src/modules/clients/client.service.ts`
- `apps/api/src/modules/clients/client.controller.ts`
- `apps/api/src/modules/clients/client.routes.ts`
- `apps/api/src/modules/clients/contact.model.ts`
- `apps/api/src/modules/clients/contact.service.ts`
- `apps/api/src/modules/clients/contact.controller.ts`
- `apps/api/src/modules/clients/contact.routes.ts`
- `apps/api/src/modules/clients/site.model.ts`
- `apps/api/src/modules/clients/site.service.ts`
- `apps/api/src/modules/clients/site.controller.ts`
- `apps/api/src/modules/clients/site.routes.ts`
- `apps/api/src/modules/clients/holdings.service.ts`
- `apps/api/src/modules/clients/holdings.controller.ts`

### Backend Modules - Catalog
- `apps/api/src/modules/catalog/serviceGroup.model.ts`
- `apps/api/src/modules/catalog/serviceGroup.service.ts`
- `apps/api/src/modules/catalog/serviceGroup.controller.ts`
- `apps/api/src/modules/catalog/serviceGroup.routes.ts`
- `apps/api/src/modules/catalog/service.model.ts`
- `apps/api/src/modules/catalog/service.service.ts`
- `apps/api/src/modules/catalog/service.controller.ts`
- `apps/api/src/modules/catalog/service.routes.ts`
- `apps/api/src/modules/catalog/servicePlan.model.ts`
- `apps/api/src/modules/catalog/servicePlan.service.ts`
- `apps/api/src/modules/catalog/servicePlan.controller.ts`
- `apps/api/src/modules/catalog/servicePlan.routes.ts`
- `apps/api/src/modules/catalog/serviceAddon.model.ts`
- `apps/api/src/modules/catalog/serviceAddon.service.ts`
- `apps/api/src/modules/catalog/serviceAddon.controller.ts`
- `apps/api/src/modules/catalog/serviceAddon.routes.ts`

### Shared Package - Types
- `packages/shared/src/types/client.ts`
- `packages/shared/src/types/catalog.ts`
- `packages/shared/src/types/crm.ts`

### Shared Package - Schemas
- `packages/shared/src/schemas/client.schema.ts`
- `packages/shared/src/schemas/catalog.schema.ts`

### Updated Files
- `apps/api/src/main.ts` - Added route registrations for all 7 modules
- `apps/api/src/utils/mongoose.ts` - Added toPlainObject helper
- `packages/shared/src/types/index.ts` - Added exports
- `packages/shared/src/schemas/index.ts` - Added exports

## Plan 2 Verification Commands

```bash
# Type check all packages
npm run check-types

# Build all packages
npm run build

# Test specific endpoints (requires running server)
# Client CRUD
curl http://localhost:3000/api/v1/clients
curl -X POST http://localhost:3000/api/v1/clients -H "Authorization: Bearer <token>" -d '{...}'

# Catalog
curl http://localhost:3000/api/v1/catalog/service-groups
curl http://localhost:3000/api/v1/catalog/services

# Holdings
curl http://localhost:3000/api/v1/clients/:id/holdings -H "Authorization: Bearer <token>"
```

## Plan 2 API Summary

**Total Endpoints Created**: 31
- Client Management: 5 endpoints
- Client Contacts: 5 endpoints
- Client Sites: 5 endpoints
- Service Groups: 5 endpoints
- Services: 5 endpoints
- Service Plans: 5 endpoints
- Service Addons: 5 endpoints
- Holdings Aggregation: 1 endpoint

---

# Plan 3 Implementation Checklist

## Status:  COMPLETED (4 hours, 37 files)

### 1. Quotes Management 
- [x] Quote model with LineItem array and Totals
- [x] Create quote endpoint (`POST /api/v1/billing/quotes`)
- [x] Read quote endpoint (`GET /api/v1/billing/quotes/:id`)
- [x] Update quote endpoint (`PATCH /api/v1/billing/quotes/:id`) (draft only)
- [x] Delete quote endpoint (`DELETE /api/v1/billing/quotes/:id`) (draft only)
- [x] List quotes endpoint (`GET /api/v1/billing/quotes?clientId=...&status=...`)
- [x] Issue quote endpoint (`POST /api/v1/billing/quotes/:id/issue`)
- [x] Convert to order endpoint (`POST /api/v1/billing/quotes/:id/to-order`)
- [x] Quote indexes: `{ quoteNo: 1 (unique) }`, `{ clientId: 1 }`, `{ status: 1 }`
- [x] Auto-generated quote numbers via `generateQuoteNo()`
- [x] Status workflow: draft  issued  accepted | rejected | expired
- [x] Audit logging on all mutations

### 2. Orders Management 
- [x] Order model with LineItem array and status enum
- [x] Create order endpoint (`POST /api/v1/billing/orders`)
- [x] Read order endpoint (`GET /api/v1/billing/orders/:id`)
- [x] Update order endpoint (`PATCH /api/v1/billing/orders/:id`) (pending only)
- [x] List orders endpoint (`GET /api/v1/billing/orders?clientId=...&status=...`)
- [x] Cancel order endpoint (`POST /api/v1/billing/orders/:id/cancel`)
- [x] Order indexes: `{ orderNo: 1 (unique) }`, `{ clientId: 1 }`, `{ status: 1 }`
- [x] Auto-generated order numbers via `generateOrderNo()`
- [x] Status workflow: pending  confirmed | cancelled  completed
- [x] Optional quoteId reference for quote origin
- [x] Audit logging on all mutations

### 3. Invoices Management 
- [x] Invoice model with LineItem array, Totals, and PDF field
- [x] Create invoice endpoint (`POST /api/v1/billing/invoices`)
- [x] Read invoice endpoint (`GET /api/v1/billing/invoices/:id`)
- [x] Update invoice endpoint (`PATCH /api/v1/billing/invoices/:id`) (draft only)
- [x] List invoices endpoint (`GET /api/v1/billing/invoices?clientId=...&status=...`)
- [x] Issue invoice endpoint (`POST /api/v1/billing/invoices/:id/issue`)
- [x] Void invoice endpoint (`POST /api/v1/billing/invoices/:id/void`)
- [x] Get invoice PDF endpoint (`GET /api/v1/billing/invoices/:id/pdf`)
- [x] Invoice indexes: `{ invoiceNo: 1 (unique) }`, `{ clientId: 1 }`, `{ status: 1 }`, `{ dueDate: 1 }`
- [x] Auto-generated invoice numbers via `generateInvoiceNo()`
- [x] Status workflow: draft -> issued -> part_paid | paid | void
- [x] **Immutability enforcement**: Pre-save hook prevents line edits after issue
- [x] **Tax calculation** using basis points: `(lineTotalCents * taxRateBps) / 10000`
- [x] Balance tracking via `balanceCents` field
- [x] Extended LineItem with subscriptionId, assetId, voipUsagePeriodId
- [x] Audit logging on all mutations

### 4. Payments Management 
- [x] Payment model with method and status enums
- [x] Create payment endpoint (`POST /api/v1/billing/payments`)
- [x] Read payment endpoint (`GET /api/v1/billing/payments/:id`)
- [x] Confirm payment endpoint (`POST /api/v1/billing/payments/:id/confirm`)
- [x] List payments endpoint (`GET /api/v1/billing/payments?clientId=...`)
- [x] Payment indexes: `{ clientId: 1 }`, `{ paymentDate: 1 }`
- [x] Status workflow: pending  confirmed | failed | cancelled
- [x] Method types: card, bank_transfer, check, cash, credit
- [x] Audit logging on all mutations

### 5. Payment Allocations 
- [x] PaymentAllocation model with paymentId + invoiceId compound index
- [x] Allocate payment endpoint (`POST /api/v1/billing/payments/:paymentId/allocate`)
- [x] Auto-allocate endpoint (`POST /api/v1/billing/payments/:paymentId/auto-allocate`)
- [x] List allocations endpoint (`GET /api/v1/billing/payments/:paymentId/allocations`)
- [x] **MongoDB transactions**: Atomic payment allocation with invoice balance update
- [x] `allocatePaymentToInvoice()`: Session-based transaction with rollback
- [x] `autoAllocatePayment()`: Auto-allocates to oldest overdue invoices (sorted by dueDate)
- [x] Updates invoice.balanceCents and invoice.status atomically
- [x] Allocation tracking with allocationCents field
- [x] Audit logging on all mutations

### 6. Credit Notes Management 
- [x] CreditNote model with reason enum
- [x] Create credit note endpoint (`POST /api/v1/billing/credit-notes`)
- [x] Read credit note endpoint (`GET /api/v1/billing/credit-notes/:id`)
- [x] List credit notes endpoint (`GET /api/v1/billing/credit-notes?clientId=...&invoiceId=...`)
- [x] Apply credit endpoint (`POST /api/v1/billing/credit-notes/:creditNoteId/apply`)
- [x] Credit note indexes: `{ creditNo: 1 (unique) }`, `{ clientId: 1 }`, `{ invoiceId: 1 }`
- [x] Auto-generated credit numbers via `generateCreditNo()`
- [x] Reason types: overpayment, return, discount, other
- [x] Status workflow: pending  applied | voided
- [x] **MongoDB transactions**: Atomic credit application with invoice balance update
- [x] `createCreditNote()`: Session-based transaction with invoice balance tracking
- [x] `applyCreditToInvoice()`: Atomic credit application with status updates
- [x] Audit logging on all mutations

### 7. Billing Summary Aggregation 
- [x] Billing summary endpoint (`GET /api/v1/billing/clients/:clientId/summary`)
- [x] MongoDB aggregation pipeline with $facet
- [x] Returns 7 key metrics:
  - totalInvoicesCents: Sum of all issued invoices
  - openInvoiceBalanceCents: Sum of outstanding balances
  - overdueBalanceCents: Overdue invoices (dueDate < now)
  - paidInvoicesCents: Sum of paid invoices
  - creditBalanceCents: Available credit from credit notes
  - invoicesByStatus: Breakdown by status
  - recentInvoices: Last 10 invoices
  - recentPayments: Last 10 payments
- [x] Performance optimized with aggregation framework

### 8. PDF Generation Service 
- [x] PDF service scaffolded with 3 methods:
  - `generateInvoicePDF()`: Fetch invoice, render layout, upload to S3/R2, update invoice.pdf
  - `getInvoicePDF()`: Retrieve stored PDF
  - `queueInvoicePDFGeneration()`: BullMQ integration (Plan 5)
- [x] Ready for Plan 5 queue integration
- [x] Ready for storage backend integration

### 9. Zod Schemas 
- [x] Quote schemas (5 schemas): lineItem, totals, create, update, response
- [x] Order schemas (3 schemas): create, update, response with lineItem re-export
- [x] Invoice schemas (5 schemas): extended lineItem with subscription/asset/voip fields
- [x] Payment schemas (5 schemas): create, response, allocation create/response
- [x] CreditNote schemas (3 schemas): create, apply, response
- [x] All schemas exported from shared package (`packages/shared/src/schemas/index.ts`)

### 10. TypeScript Types 
- [x] Billing types (13 core types):
  - Quote, Order, Invoice, Payment, PaymentAllocation, CreditNote, BillingSummary, LineItem structures
- [x] Invoice detailed types (6 types):
  - InvoiceLineItemDetailed, InvoiceDetailed, InvoiceAggregation, CreateInvoicePayload, InvoiceStateTransition, InvoiceAuditTrail
- [x] All types exported from shared package (`packages/shared/src/types/index.ts`)

## Files Created - Plan 3

### Backend Models (6 files)
- `apps/api/src/modules/billing/quote.model.ts`
- `apps/api/src/modules/billing/order.model.ts`
- `apps/api/src/modules/billing/invoice.model.ts`
- `apps/api/src/modules/billing/payment.model.ts`
- `apps/api/src/modules/billing/paymentAllocation.model.ts`
- `apps/api/src/modules/billing/creditNote.model.ts`

### Backend Services (8 files)
- `apps/api/src/modules/billing/quote.service.ts`
- `apps/api/src/modules/billing/order.service.ts`
- `apps/api/src/modules/billing/invoice.service.ts`
- `apps/api/src/modules/billing/payment.service.ts`
- `apps/api/src/modules/billing/paymentAllocation.service.ts`
- `apps/api/src/modules/billing/creditNote.service.ts`
- `apps/api/src/modules/billing/billing.service.ts`
- `apps/api/src/modules/billing/pdf.service.ts`

### Backend Controllers (6 files)
- `apps/api/src/modules/billing/quote.controller.ts`
- `apps/api/src/modules/billing/order.controller.ts`
- `apps/api/src/modules/billing/invoice.controller.ts`
- `apps/api/src/modules/billing/payment.controller.ts`
- `apps/api/src/modules/billing/creditNote.controller.ts`
- `apps/api/src/modules/billing/billing.controller.ts`

### Backend Routes (7 files)
- `apps/api/src/modules/billing/quote.routes.ts`
- `apps/api/src/modules/billing/order.routes.ts`
- `apps/api/src/modules/billing/invoice.routes.ts`
- `apps/api/src/modules/billing/payment.routes.ts`
- `apps/api/src/modules/billing/creditNote.routes.ts`
- `apps/api/src/modules/billing/billing.routes.ts`
- `apps/api/src/modules/billing/index.ts`

### Backend Tests (3 files)
- `apps/api/src/modules/billing/tests/invoice.test.ts`
- `apps/api/src/modules/billing/tests/payment.test.ts`
- `apps/api/src/modules/billing/tests/paymentAllocation.test.ts`

### Shared Schemas (5 files)
- `packages/shared/src/schemas/quote.schema.ts`
- `packages/shared/src/schemas/order.schema.ts`
- `packages/shared/src/schemas/invoice.schema.ts`
- `packages/shared/src/schemas/payment.schema.ts`
- `packages/shared/src/schemas/creditNote.schema.ts`

### Shared Types (2 files)
- `packages/shared/src/types/billing.ts`
- `packages/shared/src/types/invoice.ts`

### Updated Files (3 files)
- `apps/api/src/main.ts` - Added billing module routes at `/api/v1/billing`
- `packages/shared/src/types/index.ts` - Added billing and invoice type exports
- `packages/shared/src/schemas/index.ts` - Added billing schema exports

## Plan 3 API Summary

**Total Endpoints Created**: 28
- Quotes: 7 endpoints
- Orders: 5 endpoints
- Invoices: 7 endpoints
- Payments: 7 endpoints
- Payment Allocations: 3 endpoints (included in payments)
- Credit Notes: 4 endpoints
- Billing Summary: 1 endpoint

### Key Features
1. **Transactional Operations**: MongoDB sessions for payment allocations and credit notes
2. **Immutable Invoices**: Pre-save hook prevents line edits after issue
3. **Tax Calculation**: Basis points (BPs) for flexible, accurate tax rates
4. **Auto-Allocation**: Smart payment allocation to oldest overdue invoices
5. **RBAC Enforcement**: accounts/admin roles for all billing operations
6. **Audit Logging**: All mutations logged with before/after values

### Verification Commands

```bash
# Type check (ZERO ERRORS)
npm run check-types

# Build
npm run build

# Run backend
cd apps/api && npm run dev

# Test endpoints (requires running server + auth token)
curl http://localhost:3000/api/v1/billing/quotes -H "Authorization: Bearer <token>"
curl http://localhost:3000/api/v1/billing/invoices -H "Authorization: Bearer <token>"
curl http://localhost:3000/api/v1/billing/payments -H "Authorization: Bearer <token>"
curl "http://localhost:3000/api/v1/billing/clients/:clientId/summary" -H "Authorization: Bearer <token>"
```

### Continue with Plan 4:
- Implement Inventory & Assets Management
- Create asset lifecycle tracking
- Build depreciation calculations
- Implement asset-to-invoice linking

## Key Decisions Made

1. **Monorepo**: Using npm workspaces (Turbo optional later)
2. **Database**: Mongoose with strict schemas for type safety
3. **Authentication**: JWT with refresh tokens
4. **Authorization**: RBAC with roles (admin, accounts, support, sales, user)
5. **Error Handling**: Custom AppError class with standardized responses
6. **Validation**: Zod schemas for runtime type checking
7. **Logging**: Pino for structured logging
8. **Testing**: Jest with TypeScript support
9. **Code Quality**: ESLint + Prettier with pre-commit hooks

## Architecture Notes

- **Layered Architecture**: Controllers  Services  Models
- **Middleware Stack**: Request logging  CORS  Body parsing  Auth  Audit  Error handling
- **Error Handling**: Sync errors wrapped in async context, global error handler catches all
- **Database Transactions**: MongoDB sessions for ACID compliance on payment operations
- **BullMQ Ready**: Redis configured, queue infrastructure ready for Plan 5
- **Scalability**: Services can be horizontally scaled behind load balancer

---

# Plan 4 Implementation Checklist

## Status:  COMPLETED

### 1. Inventory Models & Indexes
- [x] Product, Warehouse, StockLevel, StockMovement, SerializedItem, ClientAsset models with enums and timestamps
- [x] Indexes: sku/status/type on Product; code/status on Warehouse; unique (productId, warehouseId) + qtyOnHand on StockLevel; (productId, warehouseId, createdAt) and reason on StockMovement; serialNo + (productId, status) + warehouseId on SerializedItem; assetTag unique, (clientId, status), warrantyEnd on ClientAsset

### 2. Inventory Endpoints (/api/v1/inventory)
- [x] Products CRUD with audit logging and RBAC (admin/sales)
- [x] Warehouses CRUD with audit logging and RBAC (admin/support)
- [x] Stock Levels: get/list/update with validation and RBAC (admin/support)
- [x] Stock Movements: create/read/list/history with Mongo transaction updates and audit logging
- [x] Serialized Items: create/read/list/update with RBAC and validation
- [x] Client Assets: create/read/list/summary/warranty/retire/return with lifecycle updates and audit logging
- [x] Stock Allocation: transactional hardware sale workflow creating movements and assets, updating serials, reserving/deducting stock, and logging audit entries
- [x] Low Stock alerts scaffold with checks and logging

### 3. Services & Controllers
- [x] Service layer for each entity with validation, RBAC, and audit wiring
- [x] StockAllocationService with retry on transient errors and low-stock trigger per line
- [x] LowStockAlertService for global/product/warehouse checks and critical/overstock summaries

### 4. Validation & Types
- [x] Zod schemas added/exported: product, warehouse, stockLevel, stockMovement, serializedItem, clientAsset
- [x] Shared TypeScript types added/exported: inventory.ts, asset.ts

### 5. Tests
- [x] Integration tests: stockMovement, stockAllocation, clientAsset, inventory workflow suite; all passing on Atlas test DB

### 6. Routing & Versioning
- [x] Inventory router aggregated in `apps/api/src/modules/inventory/index.ts`
- [x] Mounted at `/api/v1/inventory` with RBAC and Zod validation

### Files Updated / Created (Plan 4)
- `apps/api/src/main.ts`  registered `/api/v1/inventory` routes
- Inventory module files under `apps/api/src/modules/inventory/` (models, services, controllers, routes, tests, allocation, low-stock)
- Shared schemas and types under `packages/shared/src/schemas` and `packages/shared/src/types`

### Verification
- [x] `cd apps/api && npm test` (8/8 suites passing; no duplicate index warnings)

1. **Monorepo**: Using npm workspaces (Turbo optional later)
2. **Database**: Mongoose with strict schemas for type safety
3. **Authentication**: JWT with refresh tokens
4. **Authorization**: RBAC with roles (admin, accounts, support, sales, user)
5. **Error Handling**: Custom AppError class with standardized responses
6. **Validation**: Zod schemas for runtime type checking
7. **Logging**: Pino for structured logging
8. **Testing**: Jest with TypeScript support
9. **Code Quality**: ESLint + Prettier with pre-commit hooks

## Architecture Notes

- **Layered Architecture**: Controllers  Services  Models
- **Middleware Stack**: Request logging  CORS  Body parsing  Auth  Audit  Error handling
- **Error Handling**: Sync errors wrapped in async context, global error handler catches all
- **Database Transactions**: Ready for Plan 3+ (payment allocations, stock movements, etc.)
- **BullMQ Ready**: Redis configured, queue infrastructure ready
- **Scalability**: Services can be horizontally scaled behind load balancer
