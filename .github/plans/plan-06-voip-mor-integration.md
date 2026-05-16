# Plan 6: VoIP/MOR Integration & Usage Billing

**Priority**: P2  
**Duration**: ~3-4 weeks  
**Dependencies**: Plan 1 (Foundation), Plan 2 (CRM & Catalog), Plan 3 (Billing), Plan 5 (Jobs/BullMQ)

## Overview
Integrate with MOR (Kolmisoft) for Cloud Phone services, manage VoIP service instances, create usage snapshots, and generate invoices from usage periods. Scaffold all MOR API endpoints with local mocks for development.

---

## Deliverables

### 1. MOR Integration Layer (apps/api/src/integrations/mor/)

#### 1.1 MOR Client (mor.client.ts)
- [ ] Axios/HTTP wrapper for MOR API calls
- [ ] Handle authentication:
  - Support API key auth
  - Support basic auth (username/password)
  - Support token auth
- [ ] Request headers, retries, timeouts
- [ ] Request/response logging (with secret redaction)
- [ ] Error handling with normalized error responses
- [ ] Retry logic with exponential backoff (configurable)
- [ ] Timeout handling (default 30s, configurable)
- [ ] Rate limit handling (respect MOR rate limits)

#### 1.2 MOR Types & DTOs (mor.types.ts)
- [ ] Scaffold MOR API response types:
  ```typescript
  interface MorCustomer { ... }
  interface MorUser { ... }
  interface MorAccount { ... }
  interface MorUsageSummary {
    period: string; // YYYY-MM
    totalMinutes: number;
    totalCalls: number;
    totalSms: number;
    totalCostCents: number;
    ...
  }
  interface MorCallsSummary { ... }
  ```
- [ ] Request/response DTOs for all endpoints

#### 1.3 MOR Endpoints (mor.endpoints.ts)
- [ ] `testConnection()` - verify MOR API connectivity
- [ ] `getCustomer(morCustomerId)` - fetch MOR customer details
- [ ] `searchCustomers(query)` - search customers by name/code
- [ ] `getUsageSummary({ period, morCustomerId|morUserId|accountCode })`
  - Returns usage totals for a period (YYYY-MM)
  - Includes minutes, calls, SMS, cost
- [ ] `getCallsSummary({ period, ... })` (optional scaffold)
  - Detailed call records (scaffold)
- [ ] All endpoints with error handling and logging
- [ ] Use mor.client for HTTP calls

#### 1.4 MOR Mappers (mor.mappers.ts)
- [ ] `mapMorUsageSummaryToVoipUsagePeriod(morResponse, voipServiceInstanceId, clientId)`
  - Transform MOR API response → voip_usage_periods schema
  - Extract totals: totalMinutes, totalCalls, totalSms, totalCostCents
  - Set sourceMeta: fetchedAt, morReportId
  - Calculate requestHash for idempotency
- [ ] `mapMorCustomerToExternalRefs(morCustomer)`
  - Extract MOR identifiers: morCustomerId, morUserId, morAccountCode
- [ ] Error mapping and validation

#### 1.5 MOR Error Handling (mor.errors.ts)
- [ ] Custom MOR error classes:
  - `MorAuthError`
  - `MorNotFoundError`
  - `MorRateLimitError`
  - `MorTimeoutError`
  - `MorValidationError`
- [ ] Error normalization: MOR error → standard app error
- [ ] Error logging with context

#### 1.6 MOR Mock Responses (mor.mock.ts)
- [ ] Mock implementation of all MOR endpoints for development/testing
- [ ] Realistic sample data:
  - Mock customer: id, name, account code
  - Mock usage summary: minutes, calls, SMS, cost
  - Mock period: YYYY-MM format
- [ ] Mock error scenarios: auth failure, timeout, not found
- [ ] Toggle between real and mock via env var: `USE_MOR_MOCK=true`

#### 1.7 Environment Variables
- [ ] MOR_BASE_URL
- [ ] MOR_AUTH_TYPE (api_key | basic | token)
- [ ] MOR_API_KEY (if api_key auth)
- [ ] MOR_USERNAME (if basic auth)
- [ ] MOR_PASSWORD (if basic auth)
- [ ] MOR_TIMEOUT_MS (default 30000)
- [ ] MOR_RETRY_COUNT (default 3)
- [ ] USE_MOR_MOCK (true for development)
- [ ] Document all vars in `.env.example`

### 2. VoIP MOR Accounts (System Configuration)

- [ ] VoIP MOR accounts model with fields:
  - `name` (unique)
  - `baseUrl`
  - `authType` (api_key | basic | token)
  - `secretRef` (reference to secrets manager; NOT plaintext in DB)
  - `status` (active, inactive)
  - `createdAt`
- [ ] Create MOR account endpoint (`POST /api/v1/voip/mor-accounts`) - admin only
- [ ] Read MOR account endpoint (`GET /api/v1/voip/mor-accounts/:id`)
- [ ] Update MOR account endpoint (`PATCH /api/v1/voip/mor-accounts/:id`) - admin only
- [ ] List MOR accounts endpoint (`GET /api/v1/voip/mor-accounts`)
- [ ] Test connection endpoint (`POST /api/v1/voip/mor-accounts/:id/test-connection`)
  - Call mor.endpoints.testConnection()
  - Return success/failure and error details
- [ ] VoIP MOR accounts indexes: `{ name: 1 }`, `{ status: 1 }`
- [ ] Audit logging for account mutations (excluding credentials)
- [ ] **Security**: never store plaintext MOR credentials; use secrets manager (scaffolded)
- [ ] Secret rotation: add `POST /api/v1/voip/mor-accounts/:id/rotate-secret` (manual) and optional scheduled rotation policy
- [ ] Secret access audit: log every secret read attempt separately from mutation audit logs
- [ ] Encrypt `secretRef` at rest and document secrets-manager setup (AWS Secrets Manager or Vault)

### 3. VoIP Service Instances

- [ ] VoIP service instances model with fields:
  - `clientId` (reference to client)
  - `clientSiteId` (optional reference to site)
  - `serviceId` (reference to catalog service: Cloud Phone)
  - `morAccountId` (reference to voip_mor_accounts)
  - `externalRefs`:
    - `morCustomerId` (MOR customer identifier)
    - `morUserId` (MOR user identifier)
    - `morAccountCode` (MOR account code)
    - `morDeviceGroupId` (optional)
  - `status` (active, suspended, cancelled)
  - `config`:
    - `dids` (direct inward dial numbers)
    - `trunks` (trunk count)
    - `extensionsCount`
    - `recordingEnabled`
    - `menusEnabled`
  - `createdAt`
- [ ] Create VoIP instance endpoint (`POST /api/v1/voip/instances`)
  - Body: `{ clientId, clientSiteId?, serviceId, morAccountId, externalRefs, config? }`
  - Validate client and service exist
  - Validate `morAccountId` exists and MOR account status is `active`; otherwise return clear 4xx error
  - Create instance with status active
- [ ] Read VoIP instance endpoint (`GET /api/v1/voip/instances/:id`)
- [ ] Update VoIP instance endpoint (`PATCH /api/v1/voip/instances/:id`)
  - Can update config and externalRefs only
  - Reject status changes via PATCH; status transitions must use suspend/resume/cancel endpoints
- [ ] List VoIP instances endpoint (`GET /api/v1/voip/instances?clientId=...&status=active`)
- [ ] Suspend instance endpoint (`POST /api/v1/voip/instances/:id/suspend`)
- [ ] Resume instance endpoint (`POST /api/v1/voip/instances/:id/resume`)
- [ ] Cancel instance endpoint (`POST /api/v1/voip/instances/:id/cancel`)
- [ ] VoIP instances indexes: `{ clientId: 1, status: 1 }`, `{ morAccountId: 1 }`
- [ ] Audit logging for all changes

### 4. VoIP Usage Periods (Monthly Snapshots)

- [ ] VoIP usage periods model with fields:
  - `voipServiceInstanceId` (reference to voip_service_instances)
  - `clientId` (reference to client, for faster queries)
  - `period` ("YYYY-MM" format, immutable)
  - `status` (fetched, invoiced, failed)
  - `totals`:
    - `totalCostCents` (from MOR)
    - `totalChargeCents` (may differ if markup applied)
    - `totalMinutes`
    - `totalCalls`
    - `totalSms`
  - `breakdown` (optional, keep small): array of call types/costs
  - `sourceMeta`:
    - `fetchedAt` (when synced from MOR)
    - `morReportId` (MOR report identifier)
    - `requestHash` (for idempotency)
  - `invoicedInvoiceId` (link to created invoice)
  - `raw` (optional minimal subset of MOR response for debugging)
  - `createdAt`
- [ ] Get usage period endpoint (`GET /api/v1/voip/usage-periods/:id`)
- [ ] List usage periods endpoint (`GET /api/v1/voip/usage-periods?clientId=...&period=2025-01`)
- [ ] Unique index: `{ voipServiceInstanceId: 1, period: 1 }`
- [ ] Other indexes: `{ clientId: 1, period: -1 }`, `{ status: 1 }`
- [ ] Audit logging for status changes

### 5. MOR Usage Sync Worker

- [ ] Create morUsageSyncQueue in BullMQ
- [ ] Implement worker: `morUsageSyncWorker`
  - Job input: `{ voipServiceInstanceId, period: "YYYY-MM" }`
  - Steps:
    1. Load voip_service_instances with morAccountId
    2. Load voip_mor_accounts and create MOR client
    3. Resolve MOR identifiers from externalRefs
    4. Call MOR API: `getUsageSummary({ period, morCustomerId/morUserId/accountCode })`
    5. Handle response (use mock if USE_MOR_MOCK=true)
     6. Compute `requestHash` from normalized MOR response payload
     7. Idempotency check:
       - if record exists for `(voipServiceInstanceId, period, requestHash)` semantics, skip write (unchanged payload)
       - if record exists for `(voipServiceInstanceId, period)` with different hash, update existing record and metadata
     8. Upsert voip_usage_periods (unique on instance+period)
    8. Set status: fetched (or failed if error)
    9. Store totals and minimal metadata
    10. Log audit entry
  - Idempotency: unique index on (voipServiceInstanceId, period) + requestHash check
  - Retries: exponential backoff (3 retries)
  - Error handling: set status failed, log error with context, write audit entry, then move permanently failed jobs to DLQ
- [ ] Configure DLQ for `morUsageSyncQueue` with alerts (Slack/PagerDuty/email) on threshold/critical failures
- [ ] Add admin DLQ endpoint to list and safely retry failed jobs after verification
- [ ] Enqueue job: `morUsageSyncQueue.add({ voipServiceInstanceId, period }, { jobId, attempts })`
- [ ] Test with mock MOR responses

### 6. Create Invoice from Usage Period

- [ ] Implement endpoint: `POST /api/v1/voip/usage-periods/:id/invoice`
  - Body: `{ taxRateBps, dueDate? }`
  - Validations:
    - Usage period status must be fetched
    - Not already invoiced (invoicedInvoiceId must be null)
    - Authorization: caller is admin or has `invoice:write`
    - Client-scope: usage period `clientId` must match caller scope unless admin (else 403)
  - Steps:
    1. Create invoice with default one summarized line:
       - itemType: "usage"
       - description: "Cloud Phone Usage (YYYY-MM)"
       - qty: 1
       - unitPriceCents: totals.totalChargeCents
       - taxRateBps: provided or default
       - lineTotalCents: calculated
       - set invoiceLine.voipUsagePeriodId = usage period ID
    2. Calculate invoice totals with tax
    3. Set invoice.balanceCents = invoice.totals.totalCents
    4. Link voip_usage_periods.invoicedInvoiceId = invoice ID
    5. Set voip_usage_periods.status = invoiced
    6. Use MongoDB transaction
    7. Log audit entry
  - Return created invoice
- [ ] Optional: if breakdown exists in usage period, create additional breakdown lines

### 7. VoIP Endpoints (API Routes)

- [ ] `POST /api/v1/voip/mor/test-connection` (admin only)
  - Body: `{ morAccountId }`
  - Calls mor.endpoints.testConnection()
  - Returns success/failure
- [ ] `POST /api/v1/voip/instances` - create instance
- [ ] `PATCH /api/v1/voip/instances/:id` - update instance
  - Note: cannot update status through PATCH
- [ ] `GET /api/v1/voip/instances/:id` - read instance
- [ ] `GET /api/v1/voip/instances?clientId=...` - list instances
- [ ] `POST /api/v1/voip/instances/:id/suspend` - suspend instance
- [ ] `POST /api/v1/voip/instances/:id/resume` - resume instance
- [ ] `POST /api/v1/voip/instances/:id/cancel` - cancel instance
- [ ] `POST /api/v1/voip/usage/sync` (admin only)
  - Body: `{ voipServiceInstanceId, period: "YYYY-MM" }`
  - Enqueue morUsageSyncWorker job
  - Return job ID and status
- [ ] `GET /api/v1/voip/usage-periods/:id` - read usage period
- [ ] `GET /api/v1/voip/usage-periods?clientId=...&period=...` - list usage periods
- [ ] `POST /api/v1/voip/usage-periods/:id/invoice` - create invoice from usage

### 8. Zod Schemas (VoIP)

- [ ] Create validation schemas in `/packages/shared/src/schemas/`:
  - `voipInstance.schema.ts`
  - `voipUsagePeriod.schema.ts`
  - `morUsageSyncJob.schema.ts`
- [ ] Export schemas from shared package

### 9. TypeScript Types (VoIP)

- [ ] Create type definitions in `/packages/shared/src/types/`:
  - `voip.ts` (service instance, usage period)
  - `mor.ts` (MOR API types)
- [ ] Export types from shared package

---

## Key Files to Create

```
apps/api/src/
├── integrations/
│   └── mor/
│       ├── mor.client.ts
│       ├── mor.types.ts
│       ├── mor.endpoints.ts
│       ├── mor.mappers.ts
│       ├── mor.errors.ts
│       └── mor.mock.ts
├── modules/
│   └── voip/
│       ├── morAccount.model.ts
│       ├── morAccount.controller.ts
│       ├── morAccount.service.ts
│       ├── morAccount.routes.ts
│       ├── voipInstance.model.ts
│       ├── voipInstance.controller.ts
│       ├── voipInstance.service.ts
│       ├── voipInstance.routes.ts
│       ├── voipUsagePeriod.model.ts
│       ├── voipUsagePeriod.controller.ts
│       ├── voipUsagePeriod.service.ts
│       ├── voipUsagePeriod.routes.ts
│       ├── voip.routes.ts (aggregates all routes)
│       └── tests/
│           ├── morClient.test.ts
│           ├── morMappers.test.ts
│           ├── voipInstance.test.ts
│           └── voipUsagePeriod.test.ts
├── jobs/
│   └── workers/
│       ├── morUsageSyncWorker.ts
│       └── tests/
│           └── morUsageSyncWorker.test.ts

packages/shared/src/
├── types/
│   ├── voip.ts
│   └── mor.ts
├── schemas/
│   ├── voipInstance.schema.ts
│   ├── voipUsagePeriod.schema.ts
│   └── morUsageSyncJob.schema.ts
└── index.ts
```

---

## Implementation Checklist

- [ ] Create MOR integration folder structure
- [ ] Implement MOR HTTP client with auth and retries
- [ ] Define MOR API response types (scaffold)
- [ ] Implement MOR endpoints (all scaffolded with mocks)
- [ ] Implement MOR mappers for response transformation
- [ ] Create MOR error handling
- [ ] Create MOR mock responses for local dev
- [ ] Define voip_mor_accounts model
- [ ] Define voip_service_instances model
- [ ] Define voip_usage_periods model
- [ ] Create VoIP service instance CRUD endpoints
- [ ] Add tests for create-instance validation (`morAccountId` missing/inactive)
- [ ] Implement MOR usage sync worker
- [ ] Implement invoice creation from usage period
- [ ] Create all VoIP API routes
- [ ] Create Zod validation schemas
- [ ] Create TypeScript type definitions
- [ ] Write unit tests for MOR client
- [ ] Write unit tests for MOR mappers
- [ ] Write integration tests for VoIP instance CRUD
- [ ] Write integration tests for usage sync worker (with mock)
- [ ] Write integration tests for invoice creation from usage
- [ ] Test idempotency of usage sync worker
- [ ] Verify audit logs are recorded
- [ ] Test with mock MOR responses

---

## Dependencies
- Mongoose + MongoDB (transactions)
- Zod (validation)
- Express middleware stack from Plan 1
- Audit logging from Plan 1
- Axios or fetch (HTTP client)
- BullMQ + Redis
- Client entities from Plan 2
- Catalog entities from Plan 2
- Billing entities from Plan 3
- Jobs infrastructure from Plan 5

---

## Testing Strategy
- Unit tests for MOR client (mock requests/responses)
- Unit tests for MOR mappers (transformation logic)
- Unit tests for MOR error normalization
- Integration tests for VoIP instance CRUD
- Integration tests for usage sync worker (with mocked MOR API)
- Integration tests for invoice creation from usage period
- Integration tests for job idempotency
- Test error scenarios: MOR auth failure, timeout, rate limit, not found
- Test with mock MOR responses (USE_MOR_MOCK=true)
- Test secrets are not logged

---

## Definition of Done
- MOR integration is fully scaffolded with mocks
- VoIP service instances can be created and managed
- Usage sync worker successfully upserts usage periods
- Invoices can be created from usage periods
- All API responses are validated with Zod
- Audit logs record all mutations (without sensitive data)
- Integration tests pass with >80% coverage
- TypeScript compilation has zero errors
- Mock MOR responses work for local development
- Worker is idempotent and handles errors gracefully
- All credentials are managed via secrets, not hardcoded
