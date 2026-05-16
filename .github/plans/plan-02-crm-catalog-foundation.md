# Plan 2: CRM & Catalog Foundation

**Priority**: P0  
**Duration**: ~2-3 weeks  
**Dependencies**: Plan 1 (Foundation & Infrastructure)

## Overview
Establish core business entities: client profiles, contact management, site management, and the service catalog (groups, services, plans, addons). Implement the critical `GET /clients/:id/holdings` aggregation endpoint that ties everything together.

---

## Deliverables

### 1. Client Management
- [ ] Client model with fields:
  - `clientCode` (unique)
  - `legalName`, `tradingName`
  - `vatNo`, `companyRegNo`
  - `paymentTermsDays`, `creditLimitCents`, `currency`
  - `status` (active, inactive, suspended)
  - `gdprMarketingConsent`
  - `denormalizedCounters` (openInvoiceBalanceCents, overdueBalanceCents, activeSubscriptionsCount)
  - `createdAt`, `updatedAt`
- [ ] Create client endpoint (`POST /api/v1/clients`)
- [ ] Read client endpoint (`GET /api/v1/clients/:id`)
- [ ] Update client endpoint (`PATCH /api/v1/clients/:id`)
- [ ] List clients endpoint (`GET /api/v1/clients?status=active&limit=50`)
- [ ] Client indexes: `{ clientCode: 1 }`, `{ status: 1 }`, `{ createdAt: -1 }`
- [ ] Audit logging for all client mutations

### 2. Client Contacts Management
- [ ] Client contacts model with fields:
  - `clientId` (reference to client)
  - `name`, `email`, `phone`
  - `role` (primary contact, billing contact, technical contact, etc.)
  - `isPrimary` (boolean)
  - `createdAt`, `updatedAt`
- [ ] Create contact endpoint (`POST /api/v1/clients/:clientId/contacts`)
- [ ] Read contact endpoint (`GET /api/v1/clients/:clientId/contacts/:id`)
- [ ] Update contact endpoint (`PATCH /api/v1/clients/:clientId/contacts/:id`)
- [ ] Delete contact endpoint (`DELETE /api/v1/clients/:clientId/contacts/:id`)
- [ ] List contacts for client (`GET /api/v1/clients/:clientId/contacts`)
- [ ] Contacts indexes: `{ clientId: 1 }`, partial unique `{ clientId: 1, isPrimary: 1 }` with filter `{ isPrimary: true }`
- [ ] Primary-contact lifecycle rule (`createContact`, `updateContact`): when `isPrimary=true`, run in transaction and either auto-demote existing primary (`isPrimary=false`) before save (default) or reject with validation error
- [ ] Add model/service tests for primary-contact create/update race conditions
- [ ] Audit logging for contact changes

### 3. Client Sites Management
- [ ] Client sites model with fields:
  - `clientId` (reference to client)
  - `name`
  - `address` (street, city, state, postalCode, country)
  - `createdAt`, `updatedAt`
- [ ] Create site endpoint (`POST /api/v1/clients/:clientId/sites`)
- [ ] Read site endpoint (`GET /api/v1/clients/:clientId/sites/:id`)
- [ ] Update site endpoint (`PATCH /api/v1/clients/:clientId/sites/:id`)
- [ ] Delete site endpoint (`DELETE /api/v1/clients/:clientId/sites/:id`)
- [ ] List sites for client (`GET /api/v1/clients/:clientId/sites`)
- [ ] Sites index: `{ clientId: 1 }`
- [ ] Audit logging for site changes

### 4. Service Groups Catalog
- [ ] Service groups model with fields:
  - `name` (unique)
  - `description`
  - `createdAt`, `updatedAt`
- [ ] Create service group endpoint (`POST /api/v1/catalog/service-groups`)
- [ ] Read service group endpoint (`GET /api/v1/catalog/service-groups/:id`)
- [ ] Update service group endpoint (`PATCH /api/v1/catalog/service-groups/:id`)
- [ ] Delete service group endpoint (`DELETE /api/v1/catalog/service-groups/:id`)
- [ ] Referential integrity default for delete: prevent deletion when dependent services exist (`409 Conflict`, message: `Cannot delete service group with linked services`)
- [ ] Apply same integrity rule wording to catalog entities with references (`serviceGroupId`, `serviceId`): reject delete while dependents exist unless explicit reassignment/deletion flow is provided
- [ ] List service groups endpoint (`GET /api/v1/catalog/service-groups`)
- [ ] Service groups index: `{ name: 1 }`
- [ ] Audit logging for service group mutations

### 5. Services Catalog
- [ ] Services model with fields:
  - `serviceGroupId` (reference to service group)
  - `name`
  - `type` (one_off, subscription, usage, project)
  - `status` (active, inactive, deprecated)
  - `description`
  - `createdAt`, `updatedAt`
- [ ] Create service endpoint (`POST /api/v1/catalog/services`)
- [ ] Read service endpoint (`GET /api/v1/catalog/services/:id`)
- [ ] Update service endpoint (`PATCH /api/v1/catalog/services/:id`)
- [ ] Delete service endpoint (`DELETE /api/v1/catalog/services/:id`)
- [ ] List services endpoint (`GET /api/v1/catalog/services?serviceGroupId=...&type=subscription`)
- [ ] Services indexes: `{ serviceGroupId: 1 }`, `{ status: 1 }`, `{ type: 1 }`
- [ ] Audit logging for service mutations

### 6. Service Plans Catalog
- [ ] Service plans model with fields:
  - `serviceId` (reference to service)
  - `name`
  - `billingModel` (flat_fee, per_unit, tiered)
  - `billingCycle` (monthly, quarterly, annual, one_time)
  - `basePriceCents`
  - `currency` (ISO 4217 uppercase code; allowed list configured centrally)
  - `prorationEnabled` (boolean)
  - `defaultQty`
  - `description`
  - `createdAt`, `updatedAt`
- [ ] Create service plan endpoint (`POST /api/v1/catalog/service-plans`)
- [ ] Read service plan endpoint (`GET /api/v1/catalog/service-plans/:id`)
- [ ] Update service plan endpoint (`PATCH /api/v1/catalog/service-plans/:id`)
- [ ] Delete service plan endpoint (`DELETE /api/v1/catalog/service-plans/:id`)
- [ ] List service plans endpoint (`GET /api/v1/catalog/service-plans?serviceId=...`)
- [ ] Service plans index: `{ serviceId: 1 }`
- [ ] Currency validation for `POST /api/v1/catalog/service-plans` and `PATCH /api/v1/catalog/service-plans/:id`: validate ISO code and enforce configured policy for cross-currency subscriptions
- [ ] Audit logging for service plan mutations

### 7. Service Addons Catalog
- [ ] Service addons model with fields:
  - `serviceId` (reference to service)
  - `name`
  - `priceCents`
  - `currency` (ISO 4217 uppercase code; allowed list configured centrally)
  - `billingCycle` (monthly, quarterly, annual, one_time)
  - `prorationEnabled` (boolean)
  - `description`
  - `createdAt`, `updatedAt`
- [ ] Create addon endpoint (`POST /api/v1/catalog/service-addons`)
- [ ] Read addon endpoint (`GET /api/v1/catalog/service-addons/:id`)
- [ ] Update addon endpoint (`PATCH /api/v1/catalog/service-addons/:id`)
- [ ] Delete addon endpoint (`DELETE /api/v1/catalog/service-addons/:id`)
- [ ] List addons endpoint (`GET /api/v1/catalog/service-addons?serviceId=...`)
- [ ] Service addons index: `{ serviceId: 1 }`
- [ ] Currency validation for addon create/update and subscription binding
- [ ] Audit logging for addon mutations

#### Currency Consistency Policy (Catalog + Subscriptions)
- [ ] Policy: subscription currency must match `Client.currency` and selected `ServicePlan.currency`/addon currency by default
- [ ] If conversion is enabled via explicit feature flag, apply configured FX conversion before persisting amounts and store conversion metadata (rate/source/timestamp)
- [ ] In subscription create/update path (`POST /api/v1/subscriptions`, related update flow), reject mismatches with clear validation error when conversion is disabled
- [ ] Add unit tests for matching currency, mismatching-with-conversion, and mismatching-rejection scenarios

### 8. Client Holdings Aggregation
- [ ] Implement `GET /api/v1/clients/:id/holdings` endpoint
- [ ] Aggregates in parallel:
  - Client assets (from inventory, populated later)
  - Active/paused/trial subscriptions (from subscriptions module)
  - Active VoIP service instances (from VoIP module)
  - Latest usage per VoIP instance (from VoIP module)
  - Active support contracts (from support module)
- [ ] Response structure:
  ```json
  {
    "client": { ... },
    "assets": [],
    "subscriptions": [],
    "voip": [{ "instance": { ... }, "latestUsagePeriod": { ... } }],
    "supportContracts": [],
    "totals": {
      "openBalanceCents": 0,
      "overdueBalanceCents": 0,
      "activeSubscriptionsCount": 0
    }
  }
  ```
- [ ] Best-effort aggregation behavior: do not fail-fast if one module fails; return available sections and include module-level error objects plus top-level `warnings`
- [ ] Missing dependency behavior: if inventory/subscriptions/VoIP/support modules are not implemented, return empty arrays for `assets`, `subscriptions`, `voip`, `supportContracts` and include top-level `dependenciesMissing: []`
- [ ] Parallel query timeout: configurable timeout (default 2000ms) per module; on timeout return empty module data and append warning
- [ ] Totals computation rule: `totals.openBalanceCents`, `totals.overdueBalanceCents`, `totals.activeSubscriptionsCount` are computed from real-time aggregated module results (not denormalized cache) unless an explicit override flag is set
- [ ] Scaffold placeholders for inventory, subscriptions, VoIP, support data
- [ ] Performance: use lean queries and parallel execution

### 9. Zod Schemas
- [ ] Create validation schemas in `/packages/shared/src/schemas/`:
  - `client.schema.ts`
  - `contact.schema.ts`
  - `site.schema.ts`
  - `serviceGroup.schema.ts`
  - `service.schema.ts`
  - `servicePlan.schema.ts`
  - `serviceAddon.schema.ts`
- [ ] Export schemas from `/packages/shared/src/index.ts`

### 10. TypeScript Types
- [ ] Create type definitions in `/packages/shared/src/types/`:
  - `client.ts`
  - `catalog.ts`
  - `crm.ts`
- [ ] Export types from `/packages/shared/src/index.ts`

---

## Key Files to Create

```
apps/api/src/
├── modules/
│   ├── clients/
│   │   ├── client.model.ts
│   │   ├── client.controller.ts
│   │   ├── client.service.ts
│   │   ├── client.routes.ts
│   │   ├── client.schema.ts (import alias from `/packages/shared/src/schemas/client.schema.ts`)
│   │   ├── contact.model.ts
│   │   ├── contact.controller.ts
│   │   ├── contact.service.ts
│   │   ├── contact.routes.ts
│   │   ├── site.model.ts
│   │   ├── site.controller.ts
│   │   ├── site.service.ts
│   │   ├── site.routes.ts
│   │   └── holdings.service.ts (aggregation logic)
│   └── catalog/
│       ├── serviceGroup.model.ts
│       ├── serviceGroup.controller.ts
│       ├── serviceGroup.service.ts
│       ├── serviceGroup.routes.ts
│       ├── service.model.ts
│       ├── service.controller.ts
│       ├── service.service.ts
│       ├── service.routes.ts
│       ├── servicePlan.model.ts
│       ├── servicePlan.controller.ts
│       ├── servicePlan.service.ts
│       ├── servicePlan.routes.ts
│       ├── serviceAddon.model.ts
│       ├── serviceAddon.controller.ts
│       ├── serviceAddon.service.ts
│       └── serviceAddon.routes.ts

packages/shared/src/
├── types/
│   ├── client.ts
│   ├── catalog.ts
│   └── crm.ts
├── schemas/
│   ├── client.schema.ts
│   ├── contact.schema.ts
│   ├── site.schema.ts
│   ├── serviceGroup.schema.ts
│   ├── service.schema.ts
│   ├── servicePlan.schema.ts
│   └── serviceAddon.schema.ts
└── index.ts
```

---

## Implementation Checklist

- [ ] Define all Mongoose models with strict schemas
- [ ] Add all indexes for query optimization
- [ ] Create service classes with CRUD operations
- [ ] Create controllers with request validation
- [ ] Create route handlers with RBAC middleware
- [ ] Implement holdings aggregation service
- [ ] Create Zod validation schemas in shared package
- [ ] Export types and schemas from shared package
- [ ] Define standardized error response format (error codes, messages, field-level errors) across controllers and shared Zod schemas
- [ ] Implement idempotency keys for POST endpoints in controllers/service classes
- [ ] Add rate limiting for list endpoints via route middleware/RBAC stack
- [ ] Document retry and timeout strategies for external calls in services
- [ ] Write unit tests for service classes
- [ ] Write integration tests for all CRUD endpoints
- [ ] Test holdings aggregation with mock data
- [ ] Verify all audit logs are recorded
- [ ] Document API contract in OpenAPI/Swagger (optional)

---

## Dependencies
- Mongoose + MongoDB
- Zod (validation)
- Express middleware stack from Plan 1
- Audit logging from Plan 1

---

## Testing Strategy
- Unit tests for service business logic (CRUD, validation)
- Integration tests for all API endpoints
- Integration test for holdings aggregation with mock related data
- Test audit logs are created for all mutations
- Test query performance with indexes

---

## Definition of Done
- All CRM and catalog entities have full CRUD endpoints
- Holdings aggregation endpoint returns properly structured response
- All Mongoose models compile with strict schemas
- All API responses are validated with Zod
- Audit logs are recorded for all mutations
- Integration tests pass with >80% coverage
- Index queries execute within acceptable time (<100ms)
- TypeScript compilation has zero errors
- Shared types and schemas are properly exported and usable by frontend
