# Plan 7: Support & Time Tracking

**Priority**: P2  
**Duration**: ~2-3 weeks  
**Dependencies**: Plan 1 (Foundation), Plan 2 (CRM & Catalog), Plan 3 (Billing)

## Overview
Implement support contracts, ticket management with SLA tracking, and billable time entry tracking. Link time entries to invoices for billable support services.

---

## Deliverables

### 1. Support Contracts Management
- [ ] Support contracts model with fields:
  - `clientId` (reference to client)
  - `clientSiteId` (optional reference to site)
  - `name`
  - `slaTier` (basic, standard, premium, custom)
  - `includedMinutesMonthly` (support hours included)
  - `hourlyRateCents` (for time over included minutes)
  - `currency`
  - `startDate`, `renewalDate`
  - `status` (active, expired, cancelled)
  - `createdAt`, `updatedAt`
- [ ] Create support contract endpoint (`POST /api/v1/support-contracts`)
  - Body: `{ clientId, clientSiteId?, name, slaTier, includedMinutesMonthly, hourlyRateCents, startDate, renewalDate }`
- [ ] Read support contract endpoint (`GET /api/v1/support-contracts/:id`)
- [ ] Update support contract endpoint (`PATCH /api/v1/support-contracts/:id`)
- [ ] List support contracts endpoint (`GET /api/v1/support-contracts?clientId=...&status=active`)
- [ ] Support contracts indexes: `{ clientId: 1, status: 1 }`, `{ renewalDate: 1 }`
- [ ] Audit logging for contract mutations

#### SLA Tier Definitions
- [ ] Define `slaDefinitions` config used by tickets/contracts:
  - `basic`: `{ responseHours, resolutionHours, hoursType: 'business'|'24/7', humanReadableDescription }`
  - `standard`: `{ ... }`
  - `premium`: `{ ... }`
  - `custom`: `{ ownerApproved, customValues: { responseHours, resolutionHours, hoursType }, humanReadableDescription }`
- [ ] Tickets derive deadlines from `slaDefinitions` (not tier string alone)

### 2. Tickets Management
- [ ] Tickets model with fields:
  - `clientId` (reference to client)
  - `clientSiteId` (optional reference to site)
  - `assetId` (optional reference to client asset)
  - `subscriptionId` (optional reference to subscription)
  - `supportContractId` (optional reference to support contract)
  - `ticketNo` (unique)
  - `subject`, `description`
  - `priority` (low, medium, high, urgent)
  - `status` (open, in_progress, waiting_customer, resolved, closed, cancelled)
  - `slaTier` (inherited from contract or manual)
  - `slaResponseTime` (hours, derived from tier)
  - `slaResolutionTime` (hours, derived from tier)
  - `openedAt`, `firstResponseAt`, `resolvedAt`, `closedAt`
  - `assignedTo` (reference to user)
  - `createdAt`
- [ ] Create ticket endpoint (`POST /api/v1/tickets`)
  - Body: `{ clientId, clientSiteId?, assetId?, subscriptionId?, supportContractId?, subject, priority }`
  - Set status to open, openedAt to now
  - Calculate SLA times based on contract
- [ ] Read ticket endpoint (`GET /api/v1/tickets/:id`)
- [ ] Update ticket endpoint (`PATCH /api/v1/tickets/:id`)
  - Can update priority, assigned user, status
  - Set `firstResponseAt` when support staff posts the first response/comment on the ticket (status-only changes do not set it)
- [ ] Close ticket endpoint (`POST /api/v1/tickets/:id/close`)
  - Set status to closed, closedAt to now
- [ ] List tickets endpoint (`GET /api/v1/tickets?clientId=...&status=open&priority=high`)
- [ ] Tickets indexes: `{ ticketNo: 1 }`, `{ clientId: 1, status: 1 }`, `{ priority: 1 }`, `{ openedAt: -1 }`
- [ ] Audit logging for ticket mutations

### 3. SLA Tracking & Monitoring
- [ ] Implement SLA calculation service
- [ ] Service method: `getSLAStatus(ticket)`
  - Returns: `{ isBreached, hoursUntilBreach, status: 'on_track'|'at_risk'|'breached', mode: 'business'|'24/7', pausedDurationMinutes }`
  - Based on ticket.slaResponseTime, ticket.slaResolutionTime and `slaDefinitions`
- [ ] Implement SLA breach detection
  - Pause SLA clocks while `ticket.status === 'waiting_customer'`
  - firstResponseAt must be set within slaResponseTime hours (excluding paused intervals)
  - resolvedAt must be set within slaResolutionTime hours from openedAt (excluding paused intervals)
  - Support configurable business-hours mode (`startHour`, `endHour`, `weekdays`) vs 24/7
- [ ] Endpoint: `GET /api/v1/tickets/:id/sla-status`
  - Returns SLA status and time tracking
- [ ] List tickets by SLA status: `GET /api/v1/tickets/sla-status?status=breached`

### 4. Time Entries Management
- [ ] Time entries model with fields:
  - `ticketId` (reference to ticket)
  - `userId` (reference to user)
  - `startedAt`, `durationMinutes`
  - `billable` (boolean)
  - `rateCents` (override hourly rate from contract)
  - `currency`
  - `description` (what work was done)
  - `invoiceId` (optional link to created invoice)
  - `invoiceLineId` (optional link to invoice line)
  - `createdAt`
- [ ] Create time entry endpoint (`POST /api/v1/time-entries`)
  - Body: `{ ticketId, userId, startedAt, durationMinutes, billable, rateCents?, description }`
  - If billable and no rateCents, use contract hourly rate
  - Validation: startedAt <= now, durationMinutes > 0
- [ ] Read time entry endpoint (`GET /api/v1/time-entries/:id`)
- [ ] Update time entry endpoint (`PATCH /api/v1/time-entries/:id`)
  - Can only update non-invoiced entries
- [ ] Delete time entry endpoint (`DELETE /api/v1/time-entries/:id`)
  - Can only delete non-invoiced entries
- [ ] List time entries endpoint (`GET /api/v1/time-entries?ticketId=...&billable=true`)
- [ ] Time entries indexes: `{ ticketId: 1 }`, `{ userId: 1 }`, `{ billable: 1 }`, `{ invoiceId: 1 }`
- [ ] Audit logging for time entry mutations

### 5. Time Entry Billing Calculation
- [ ] Implement service: `calculateTimeEntryCharge(timeEntry, contract?)`
  - Returns chargeCents based on duration and rate
  - Formula: `(durationMinutes / 60) * rateCents`, rounded with `Math.round` to nearest cent
- [ ] Implement service: `aggregateTimeEntriesByTicket(ticketId, period?)`
  - Returns total billable minutes and charge for a ticket
- [ ] Implement service: `aggregateTimeEntriesByClient(clientId, period?)`
  - Returns summary of all billable time for client in period
- [ ] Implement `calculateContractUsage(contractId, month)` returning `usedMinutes`, `remainingMinutes`, `overageMinutes`
- [ ] Charge overage only: apply `hourlyRateCents` to minutes above included monthly minutes (prorate entries crossing included→overage boundary)

### 6. Create Invoice from Time Entries
- [ ] Implement endpoint: `POST /api/v1/support/invoices/from-time-entries`
  - Body: `{ clientId, period: "YYYY-MM", ticketIds?: [] }`
  - Aggregates all billable, non-invoiced time entries for client (or specific tickets)
  - Validate all aggregated TimeEntry/Contract records belong to provided `clientId`
  - Validate currency consistency; reject mixed currency or split invoices by currency per configured policy
  - Idempotency: return existing invoice for same `clientId + period` (and optional idempotency key)
  - Creates invoice with multiple lines (one per ticket or consolidated)
  - Each line: itemType=time, description, duration in hours, rate, total
  - Set time entries invoiceId and invoiceLineId links
  - Uses MongoDB transaction
  - Returns created invoice
- [ ] Endpoint: `GET /api/v1/support/time-entries/uninvoiced?clientId=...`
  - Returns aggregated billable time not yet invoiced

### 7. Support Dashboard Endpoints
- [ ] Endpoint: `GET /api/v1/support/tickets/summary?clientId=...`
  - Returns:
    ```json
    {
      "openTickets": 0,
      "slaBreaches": 0,
      "averageResolutionTime": 0,
      "totalTimeEntriesHours": 0,
      "uninvoicedTimeEntriesHours": 0,
      "uninvoicedChargeCents": 0
    }
    ```
- [ ] Endpoint: `GET /api/v1/support/contracts/summary?clientId=...`
  - Returns: active contracts, included minutes used, overage charges

### 8. Support Module Routes
- [ ] Aggregate all support routes in `/modules/support/support.routes.ts`
- [ ] Include: contracts, tickets, time entries, SLA status, invoicing, summaries

### 9. Zod Schemas (Support)
- [ ] Create validation schemas in `/packages/shared/src/schemas/`:
  - `supportContract.schema.ts`
  - `ticket.schema.ts`
  - `timeEntry.schema.ts`
- [ ] Export schemas from shared package

### 10. TypeScript Types (Support)
- [ ] Create type definitions in `/packages/shared/src/types/`:
  - `support.ts` (contract, ticket, SLA)
  - `timeEntry.ts`
- [ ] Export types from shared package

---

## Key Files to Create

```
apps/api/src/
├── modules/
│   └── support/
│       ├── supportContract.model.ts
│       ├── supportContract.controller.ts
│       ├── supportContract.service.ts
│       ├── supportContract.routes.ts
│       ├── ticket.model.ts
│       ├── ticket.controller.ts
│       ├── ticket.service.ts
│       ├── ticket.routes.ts
│       ├── sla.service.ts
│       ├── timeEntry.model.ts
│       ├── timeEntry.controller.ts
│       ├── timeEntry.service.ts
│       ├── timeEntry.routes.ts
│       ├── supportInvoicing.service.ts
│       ├── support.routes.ts (aggregates all routes)
│       └── tests/
│           ├── ticket.test.ts
│           ├── timeEntry.test.ts
│           ├── sla.test.ts
│           └── supportInvoicing.test.ts

packages/shared/src/
├── types/
│   ├── support.ts
│   └── timeEntry.ts
├── schemas/
│   ├── supportContract.schema.ts
│   ├── ticket.schema.ts
│   └── timeEntry.schema.ts
└── index.ts
```

---

## Implementation Checklist

- [ ] Define support contract Mongoose model
- [ ] Define ticket Mongoose model
- [ ] Define time entry Mongoose model
- [ ] Add all indexes for query optimization
- [ ] Create support contract service with CRUD
- [ ] Create ticket service with CRUD and status transitions
- [ ] Create SLA calculation service
- [ ] Create time entry service with CRUD
- [ ] Create time entry billing calculation service
- [ ] Define SLA tier configuration (response/resolution for basic, standard, premium, custom)
- [ ] Implement ticket number generation strategy (unique ticketNo)
- [ ] Implement contract included minutes tracking and overage calculation
- [ ] Implement SLA pause logic for waiting_customer status
- [ ] Configure business hours vs 24/7 SLA calculation
- [ ] Create support invoicing service
- [ ] Create controllers with request validation
- [ ] Create route handlers with RBAC middleware
- [ ] Create Zod validation schemas
- [ ] Write unit tests for SLA calculations
- [ ] Write unit tests for time billing calculations
- [ ] Write integration tests for ticket CRUD
- [ ] Write integration tests for time entry CRUD
- [ ] Write integration tests for invoice creation from time entries
- [ ] Test SLA breach detection
- [ ] Test time entry aggregation
- [ ] Verify audit logs are recorded

---

## Dependencies
- Mongoose + MongoDB (transactions)
- Zod (validation)
- Express middleware stack from Plan 1
- Audit logging from Plan 1
- Client and Catalog entities from Plan 2
- Billing entities from Plan 3
- User model from Plan 1

---

## Testing Strategy
- Unit tests for SLA calculation (response time, resolution time)
- Unit tests for time entry billing (hours, rates)
- Unit tests for time aggregation (multiple entries, multiple tickets)
- Integration tests for ticket CRUD with status transitions
- Integration tests for time entry CRUD
- Integration tests for invoice creation from time entries
- Integration tests for SLA status retrieval
- Test concurrent time entry creation
- Test time entry updates and immutability after invoicing

---

## Definition of Done
- Support contract CRUD endpoints work correctly
- Ticket lifecycle (open → in_progress → resolved → closed) works
- SLA tracking calculates and detects breaches correctly
- Time entries can be created and tracked
- Time billing calculations are accurate
- Invoices can be created from time entries
- All API responses are validated with Zod
- Audit logs record all mutations
- Integration tests pass with >80% coverage
- TypeScript compilation has zero errors
- SLA status reflects breach conditions correctly
