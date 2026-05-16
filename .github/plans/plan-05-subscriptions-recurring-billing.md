# Plan 5: Subscriptions & Recurring Billing

**Priority**: P1  
**Duration**: ~3 weeks  
**Dependencies**: Plan 1 (Foundation), Plan 2 (CRM & Catalog), Plan 3 (Billing)

## Overview
Implement subscription management with lifecycle tracking, recurring invoice generation, and BullMQ integration for automated subscription billing worker.

---

## Deliverables

### 1. Client Subscriptions Management
- [ ] Client subscriptions model with fields:
  - `clientId` (reference to client)
  - `clientSiteId` (optional reference to site)
  - `servicePlanId` (reference to service plan from catalog)
  - `billingCycle` (monthly | quarterly | annual)
  - `quantity`
  - `unitPriceCents` (overridable from service plan)
  - `currency`
  - `trialPeriodDays` (optional)
  - `autoRenew` (boolean, default `true`)
  - `paymentMethodId` (required when `autoRenew=true`)
  - `status` (trial, active, paused, cancelled, expired)
  - `startDate`, `currentPeriodStartDate`, `currentPeriodEndDate`, `nextInvoiceDate`, `contractEndDate`
  - `cancelledAt` (timestamp when cancelled)
  - `addonItems` (array):
    - `addonId` (reference to service addon)
    - `quantity`
    - `unitPriceCents`
  - `notes` (optional)
  - `createdAt`, `updatedAt`
- [ ] Create subscription endpoint (`POST /api/v1/subscriptions`)
  - Body: `{ clientId, clientSiteId?, servicePlanId, quantity, unitPriceCents?, addonItems?, startDate }`
  - Calculate nextInvoiceDate based on billingCycle
  - Set status to trial (or active if no trial period)
- [ ] Read subscription endpoint (`GET /api/v1/subscriptions/:id`)
- [ ] Update subscription endpoint (`PATCH /api/v1/subscriptions/:id`)
  - Only when status is active/trial/paused
  - Cannot change billing start date
  - If `prorationEnabled=true`, quantity/price changes do not change `nextInvoiceDate`; create proration adjustment for next scheduled invoice
  - If `prorationEnabled=false`, defer change to next billing cycle (no immediate rebill)
- [ ] Pause subscription endpoint (`POST /api/v1/subscriptions/:id/pause`)
  - Set status to paused
  - Preserve `nextInvoiceDate`
- [ ] Resume subscription endpoint (`POST /api/v1/subscriptions/:id/resume`)
  - Set status back to active
  - Resume policy (Option B): keep original `nextInvoiceDate`; do not retroactively bill missed paused periods
- [ ] Cancel subscription endpoint (`POST /api/v1/subscriptions/:id/cancel`)
  - Set status to cancelled, record cancelledAt
  - Generate pro-rata credit note if applicable (scaffold)
- [ ] List subscriptions endpoint (`GET /api/v1/subscriptions?clientId=...&status=active`)
- [ ] Subscriptions indexes: `{ clientId: 1, status: 1 }`, `{ nextInvoiceDate: 1 }`, `{ servicePlanId: 1 }`
- [ ] Audit logging for all subscription mutations

### 2. Subscription Billing Calculation Service
- [ ] Implement service: `calculateSubscriptionInvoiceLines(subscription)`
  - Returns array of invoice lines for one billing period
  - Base plan line: { itemType: "subscription", qty, unitPrice, etc. }
  - Addon lines (if present)
  - Apply proration if mid-period changes (scaffold logic)
- [ ] Implement service: `calculateNextInvoiceDate(subscription)`
  - Based on billingCycle (monthly, quarterly, annual)
  - Handles subscription start date and renewal
- [ ] Tax calculation helpers (shared with billing module)

### 3. Subscription Billing Worker (BullMQ)
- [ ] Create subscription billing queue: `subscriptionBillingQueue`
- [ ] Implement worker: `subscriptionBillingWorker`
  - Job input: `{ subscriptionId, period }` (optional)
  - If no subscriptionId: find all subscriptions with nextInvoiceDate <= today and status active
  - For each due subscription:
    1. Pre-check expiration: if `contractEndDate < now` or `nextInvoiceDate >= contractEndDate`, mark subscription expired and skip billing (log `expired before billing`)
    2. Calculate invoice lines
    3. Create invoice with lines
    4. Issue invoice (status to issued, set balanceCents)
    5. Update subscription.nextInvoiceDate (add billing cycle)
    6. Log audit entry
  - Wrap `calculateInvoiceLines -> createInvoice -> issueInvoice -> updateSubscriptionNextInvoiceDate` in one DB transaction
  - Idempotency: hash `subscriptionId + normalizedPeriod` (ISO date/period ID). If period omitted for single-subscription runs, normalize to billing date (`today` in UTC). For worker-wide runs use deterministic daily key: `worker:all-subscriptions:<YYYY-MM-DD>`
  - Retries: exponential backoff (3 retries default)
  - Error handling: mark job as failed, log error, send alert
- [ ] Enqueue job: `subscriptionBillingQueue.add({ subscriptionId? }, { jobId, attempts })`
- [ ] Test with mock subscriptions

### 4. Scheduled Subscription Billing Trigger (Daily)
- [ ] Create scheduled job to run subscription billing worker daily
- [ ] Cron expression: `0 2 * * *` (2 AM UTC)
- [ ] Enqueue all due subscriptions to subscriptionBillingQueue
- [ ] Log each enqueue action
- [ ] Error handling and retry logic

### 5. Trial Period Management (Scaffolded)
- [ ] Implement trial expiration detection
- [ ] When trial expires: status transitions from trial → active (if payment method set) or → expired
- [ ] Generate invoice for first paid period
- [ ] Send trial expiration reminder email (integrated with Plan 8)
- [ ] Service method: `checkTrialExpirations()` (scaffold)

### 6. Renewal Management
- [ ] Implement renewal period logic
- [ ] When `contractEndDate` approaches: send renewal reminder email (Plan 8)
- [ ] Auto-renew if enabled (scaffold setting per client/subscription)
- [ ] Manual renewal option: `POST /api/v1/subscriptions/:id/renew`
- [ ] After renewal: preserve original `startDate`; update `currentPeriodStartDate`/`currentPeriodEndDate` and `nextInvoiceDate`, update status if needed

### 7. Proration Logic (Scaffolded)
- [ ] Implement proration calculation for mid-period quantity/price changes
- [ ] Only when prorationEnabled = true on service plan
- [ ] Calculate days used in current period vs. total days
- [ ] Apply adjustment line to next invoice
- [ ] Service method: `calculateProrationCredit(subscription, oldQty, newQty, oldPrice, newPrice)`

### 8. Subscription Billing Summary
- [ ] Implement endpoint: `GET /api/v1/subscriptions/summary?clientId=...`
- [ ] Returns:
  ```json
  {
    "activeSubscriptions": 0,
    "totalMonthlyRecurringCents": 0,
    "trialSubscriptions": 0,
    "expiringSoonCount": 0,
    "subscriptions": []
  }
  ```

### 9. BullMQ Infrastructure Setup
- [ ] Initialize BullMQ in `/apps/api/src/jobs/queues.ts`
- [ ] Configure Redis connection
- [ ] Create queue instances:
  - `subscriptionBillingQueue`
  - Prepare for: `dunningQueue`, `morUsageSyncQueue`, `pdfQueue`, `emailQueue` (from other plans)
- [ ] Implement queue event listeners (on-complete, on-failure, on-progress)
- [ ] Add health check for queue connectivity
- [ ] Setup Bull Dashboard for monitoring (optional, scaffolded)

### 10. Worker Orchestration
- [ ] Create worker registry: `/apps/api/src/jobs/workers/index.ts`
- [ ] Export and initialize all workers
- [ ] In main.ts: start workers when app starts
- [ ] Graceful shutdown: close workers on SIGTERM
- [ ] Logger integration for worker events

### 11. Zod Schemas (Subscriptions)
- [ ] Create validation schemas in `/packages/shared/src/schemas/`:
  - `subscription.schema.ts`
  - `subscriptionBillingJob.schema.ts`
- [ ] Export schemas from shared package

### 12. TypeScript Types (Subscriptions)
- [ ] Create type definitions in `/packages/shared/src/types/`:
  - `subscription.ts`
  - `jobs.ts` (for BullMQ job types)
- [ ] Export types from shared package

---

## Key Files to Create

```
apps/api/src/
├── modules/
│   └── subscriptions/
│       ├── subscription.model.ts
│       ├── subscription.controller.ts
│       ├── subscription.service.ts
│       ├── subscription.routes.ts
│       ├── subscriptionBilling.service.ts
│       ├── subscriptionProration.service.ts
│       ├── subscriptionTrial.service.ts
│       ├── subscriptionRenewal.service.ts
│       └── tests/
│           ├── subscription.test.ts
│           ├── subscriptionBilling.test.ts
│           └── subscriptionProration.test.ts
├── jobs/
│   ├── queues.ts (BullMQ initialization)
│   ├── workers/
│   │   ├── index.ts (worker registry)
│   │   ├── subscriptionBillingWorker.ts
│   │   └── scheduledSubscriptionTrigger.ts (cron job)
│   └── tests/
│       └── subscriptionBillingWorker.test.ts

packages/shared/src/
├── types/
│   ├── subscription.ts
│   └── jobs.ts
├── schemas/
│   ├── subscription.schema.ts
│   └── subscriptionBillingJob.schema.ts
└── index.ts
```

---

## Implementation Checklist

- [ ] Define subscription Mongoose model with strict schemas
- [ ] Add indexes for query optimization
- [ ] Implement subscription service with CRUD and lifecycle methods
- [ ] Implement billing calculation service with tax and addons
- [ ] Implement nextInvoiceDate calculation logic
- [ ] Setup BullMQ with Redis connection
- [ ] Create subscription billing worker
- [ ] Implement subscription billing trigger (daily cron)
- [ ] Implement trial expiration detection (scaffold)
- [ ] Implement renewal logic (scaffold)
- [ ] Implement proration calculation (scaffold)
- [ ] Enforce subscription model validation for `billingCycle`, `trialPeriodDays`, `autoRenew`, and `paymentMethodId`
- [ ] Document compensation strategy for partial failures (void/refund issued invoice and safe retry of `nextInvoiceDate` updates)
- [ ] Create controllers with request validation
- [ ] Create route handlers with RBAC middleware
- [ ] Create Zod validation schemas
- [ ] Write unit tests for billing calculations
- [ ] Write integration tests for subscription CRUD
- [ ] Write integration tests for billing worker (with mock job)
- [ ] Test worker idempotency
- [ ] Test error handling and retries
- [ ] Verify audit logs are recorded

---

## Dependencies
- Mongoose + MongoDB
- Zod (validation)
- Express middleware stack from Plan 1
- Audit logging from Plan 1
- BullMQ + Redis
- Client and Catalog entities from Plan 2
- Billing entities from Plan 3
- Cron scheduler (node-cron or similar)

---

## Testing Strategy
- Unit tests for subscription billing calculations
- Unit tests for nextInvoiceDate calculation
- Unit tests for proration logic (if implemented)
- Integration tests for subscription CRUD with status transitions
- Integration tests for billing worker with mock Redis
- Integration tests for trial expiration
- Integration tests for renewal logic
- Test worker idempotency by re-running same job
- Test error handling in worker (failed invoice creation, etc.)
- Test scheduled trigger finds due subscriptions

---

## Definition of Done
- Subscriptions CRUD endpoints work correctly
- Subscription lifecycle (trial → active → expired/cancelled) works
- Billing worker generates invoices correctly
- nextInvoiceDate is calculated accurately
- Worker is idempotent (re-run produces same result)
- All API responses are validated with Zod
- Audit logs record all mutations
- Integration tests pass with >80% coverage
- TypeScript compilation has zero errors
- BullMQ worker runs and completes jobs successfully
- Proration and trial logic are scaffolded and functional
