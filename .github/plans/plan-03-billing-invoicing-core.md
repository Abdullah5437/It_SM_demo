# Plan 3: Billing & Invoicing Core

**Priority**: P1  
**Duration**: ~3 weeks  
**Dependencies**: Plan 1 (Foundation), Plan 2 (CRM & Catalog)

## Overview
Implement complete billing workflows: quotes, orders, invoices (immutable snapshots), payments, allocations, and credit notes. Establish transactional consistency for payment operations and scaffold PDF generation.

---

## Deliverables

### 1. Quotes Management
- [ ] Quote model with fields:
  - `quoteNo` (unique)
  - `clientId` (reference to client)
  - `issueDate`, `validUntil`
  - `status` (draft, issued, accepted, rejected, expired)
  - `currency`
  - `totals` { subTotalCents, taxCents, totalCents }
  - `lines` (array of quote line items)
  - `createdBy`, `createdAt`
- [ ] Quote line items with fields:
  - `lineNo`, `itemType` (product, service, addon, other)
  - `description`, `qty`, `unitPriceCents`
  - `taxRateBps` (basis points)
  - `lineTotalCents`
  - `refs` (productId, servicePlanId, serviceAddonId - optional references)
- [ ] Create quote endpoint (`POST /api/v1/quotes`)
- [ ] Read quote endpoint (`GET /api/v1/quotes/:id`)
- [ ] Update quote endpoint (`PATCH /api/v1/quotes/:id`) - only draft quotes
- [ ] Delete quote endpoint (`DELETE /api/v1/quotes/:id`) - only draft quotes
- [ ] List quotes endpoint (`GET /api/v1/quotes?clientId=...&status=...`)
- [ ] Convert quote to order endpoint (`POST /api/v1/quotes/:id/to-order`)
- [ ] Quotes indexes: `{ quoteNo: 1 }`, `{ clientId: 1 }`, `{ status: 1 }`
- [ ] Audit logging for all quote mutations

### 2. Orders Management
- [ ] Order model with fields:
  - `orderNo` (unique)
  - `clientId` (reference to client)
  - `quoteId` (optional reference to quote)
  - `orderDate`, `status` (pending, confirmed, cancelled, completed)
  - `currency`
  - `lines` (array of order line items - same structure as quote lines)
  - `createdBy`, `createdAt`
- [ ] Create order endpoint (`POST /api/v1/orders`)
- [ ] Read order endpoint (`GET /api/v1/orders/:id`)
- [ ] Update order endpoint (`PATCH /api/v1/orders/:id`) - only pending orders
- [ ] Confirm order endpoint (`POST /api/v1/orders/:id/confirm`) - transition `pending -> confirmed`, set `confirmedAt`
- [ ] Complete order endpoint (`POST /api/v1/orders/:id/complete`) - transition `confirmed -> completed`, set `completedAt`
- [ ] Cancel order endpoint (`POST /api/v1/orders/:id/cancel`)
- [ ] List orders endpoint (`GET /api/v1/orders?clientId=...&status=...`)
- [ ] Orders indexes: `{ orderNo: 1 }`, `{ clientId: 1 }`, `{ status: 1 }`
- [ ] Audit logging for order mutations

### 3. Invoices Management (Immutable Snapshots)
- [ ] Invoice model with fields:
  - `invoiceNo` (unique; immutable legal identifier)
  - `clientId` (reference to client)
  - `orderId` (optional reference to order)
  - `status` (draft, issued, part_paid, paid, void)
  - `issueDate`, `dueDate`
  - `currency`
  - `totals` { subTotalCents, taxCents, totalCents }
  - `balanceCents` (remaining amount to pay)
  - `lines` (array - EMBEDDED, immutable after issued):
    - `lineNo`, `itemType`, `description`, `qty`, `unitPriceCents`
    - `taxRateBps`, `lineTotalCents`
    - `productId`, `servicePlanId`, `serviceAddonId`, `subscriptionId`, `assetId`, `voipUsagePeriodId` (optional references)
  - `pdf` { storageKey, generatedAt } (optional)
  - `createdBy`, `createdAt`
- [ ] Create invoice endpoint (`POST /api/v1/invoices`)
  - Body: `{ clientId, orderId?, lines[], dueDate?, currency }`
  - Calculate totals with tax
  - Set status to draft, balanceCents = totalCents
- [ ] Read invoice endpoint (`GET /api/v1/invoices/:id`)
- [ ] Update invoice endpoint (`PATCH /api/v1/invoices/:id`) - only draft invoices
- [ ] Issue invoice endpoint (`POST /api/v1/invoices/:id/issue`)
  - Set status to issued, prevents further edits
  - Trigger audit log
- [ ] Void invoice endpoint (`POST /api/v1/invoices/:id/void`)
  - Set status to void
  - If invoice status is `issued` and has paid/partially paid amount, create linked credit note (mandatory)
  - Set `invoice.balanceCents = 0`
- [ ] List invoices endpoint (`GET /api/v1/invoices?clientId=...&status=...`)
- [ ] Invoices indexes: `{ invoiceNo: 1 }`, `{ clientId: 1 }`, `{ status: 1 }`, `{ dueDate: 1 }`
- [ ] Audit logging for invoice mutations
- [ ] Invoice numbering policy (`invoiceNo`): sequential format `INV-YYYY-XXXX`, zero-padded 4+ digits, sequence resets yearly, global sequence across tenants unless jurisdiction requires tenant partitioning
- [ ] Numbering rules: non-reusable/non-replicable, immutable after issue, gaps allowed only for voided/rejected transaction attempts with audit trail, migration/import numbers flagged as external

### 4. Payments Management
- [ ] Payment model with fields:
  - `clientId` (reference to client)
  - `paymentDate`
  - `method` (card, bank_transfer, check, cash, credit_card)
  - `reference` (transaction ID, check number, etc.)
  - `amountCents`
  - `currency`
  - `idempotencyKey` (string, unique)
  - `status` (pending, confirmed, failed, cancelled)
  - `createdAt`
- [ ] Create payment endpoint (`POST /api/v1/payments`)
  - Body: `{ clientId, paymentDate, method, reference, amountCents, currency, idempotencyKey }`
  - Validation: amountCents > 0
  - Idempotency: lookup by `idempotencyKey` and return existing payment if found
  - Creates payment record with status pending
- [ ] Read payment endpoint (`GET /api/v1/payments/:id`)
- [ ] List payments endpoint (`GET /api/v1/payments?clientId=...`)
- [ ] Confirm payment endpoint (`POST /api/v1/payments/:id/confirm`)
  - Set status to confirmed
  - Before auto-allocation, enforce `payment.currency === invoice.currency` for candidate invoices
  - In `autoAllocatePayment`/matching helpers, re-check currency to protect direct service calls
- [ ] Payments index: `{ idempotencyKey: 1 }` (unique), `{ clientId: 1 }`, `{ paymentDate: -1 }`
- [ ] Audit logging for payment creation

### 5. Payment Allocations (with Transactions)
- [ ] Payment allocation model with fields:
  - `paymentId` (reference to payment)
  - `invoiceId` (reference to invoice)
  - `amountCents`
  - `createdAt`
- [ ] Allocate payment to invoice endpoint (`POST /api/v1/payments/:paymentId/allocate`)
  - Body: `{ invoiceId, amountCents }`
  - MongoDB transaction:
    1. Load payment and invoice
    2. Validate `payment.clientId === invoice.clientId` (reject mismatches with 4xx before amount checks)
    2. Validate payment status confirmed, invoice status not paid/void
    3. Validate amountCents <= payment remaining balance
    4. Create payment_allocation record
    5. Update invoice.balanceCents -= amountCents
    6. Update invoice.status if fully paid
    7. Update client.denormalizedCounters
    8. Log audit entry
- [ ] Auto-allocate endpoint (`POST /api/v1/payments/:paymentId/auto-allocate`)
  - Intelligently allocate payment to oldest overdue invoices first
  - Use transaction for consistency with `readConcern/writeConcern=majority`
  - Use conditional atomic updates (`findOneAndUpdate`/`updateOne` with balance/version filters) for payment + invoice before creating allocation record
  - Abort transaction if conditional update matches zero documents (race protection)
- [ ] Delete payment allocation endpoint (`DELETE /api/v1/payment-allocations/:id`)
  - Reversal flow in one transaction: restore payment remaining balance, restore invoice balance, recompute invoice status, update client counters, mark/delete allocation, write audit entry
- [ ] List allocations endpoint (`GET /api/v1/payments/:paymentId/allocations`)
- [ ] Payment allocations index: `{ _id: 1 }`, `{ paymentId: 1 }`, `{ invoiceId: 1 }`
- [ ] Audit logging for all allocations

### 6. Credit Notes
- [ ] Credit note model with fields:
  - `creditNo` (unique)
  - `clientId` (reference to client)
  - `invoiceId` (reference to original invoice)
  - `issueDate`
  - `amountCents`
  - `appliedAmountCents` (default 0)
  - `status` (`available`, `partially_applied`, `fully_applied`, `void`)
  - `currency`
  - `reason` (overpayment, return, discount, other)
  - `createdAt`
- [ ] Create credit note endpoint (`POST /api/v1/credit-notes`)
  - Body: `{ clientId, invoiceId, amountCents, reason }`
  - Reduces client openInvoiceBalance and increases credit balance
  - Uses MongoDB transaction
- [ ] Read credit note endpoint (`GET /api/v1/credit-notes/:id`)
- [ ] List credit notes endpoint (`GET /api/v1/credit-notes?clientId=...`)
- [ ] Apply credit to invoice endpoint (`POST /api/v1/credit-notes/:id/apply`)
  - Validate `creditNote.clientId === invoice.clientId` before applying
  - Validate `appliedAmountCents + newApplication <= amountCents`
  - Reduces invoice balanceCents
  - Update credit note `appliedAmountCents` and `status` after each application
  - Uses MongoDB transaction
- [ ] Credit notes index: `{ creditNo: 1 }`, `{ clientId: 1 }`, `{ invoiceId: 1 }`
- [ ] Audit logging for credit notes

### 7. PDF Generation (Scaffolded)
- [ ] Create PDF generation service (`src/modules/billing/pdf.service.ts`)
- [ ] Implement invoice PDF scaffold:
  - Accept invoice ID
  - Generate basic invoice layout (company logo, invoice number, dates, line items, totals)
  - Store in S3/R2 (placeholder; mock for now)
  - Update invoice.pdf.storageKey and generatedAt
- [ ] Enqueue PDF generation to job queue (BullMQ - implemented in Plan 5)
- [ ] PDF generation in Plan 3 is synchronous/blocking only; queue-based async generation is deferred to Plan 5 (explicit dependency)
- [ ] Retrieve invoice PDF endpoint (`GET /api/v1/invoices/:id/pdf`)

### 8. Billing Summary Endpoint
- [ ] Implement `GET /api/v1/clients/:id/billing-summary`
- [ ] Returns:
  ```json
  {
    "clientId": "...",
    "totalInvoicedAmountCents": 0,
    "openInvoiceBalanceCents": 0,
    "overdueBalanceCents": 0,
    "paidInvoicesCents": 0,
    "creditBalanceCents": 0,
    "invoicesByStatus": { "draft": 0, "issued": 0, "paid": 0 },
    "recentInvoices": [],
    "recentPayments": []
  }
  ```

### 9. Zod Schemas (Billing)
- [ ] Create validation schemas in `/packages/shared/src/schemas/`:
  - `quote.schema.ts`
  - `order.schema.ts`
  - `invoice.schema.ts`
  - `payment.schema.ts`
  - `creditNote.schema.ts`
- [ ] Schema rules:
  - `dueDate > issueDate` for invoices/orders
  - `validUntil > issueDate` for quotes
  - `amountCents` is positive integer
  - `currency` validated against ISO 4217 code set
  - `status` enforced as strict enum per entity
- [ ] Export schemas from shared package

### 10. TypeScript Types (Billing)
- [ ] Create type definitions in `/packages/shared/src/types/`:
  - `billing.ts` (Quote, Order, Invoice, Payment, CreditNote)
  - `invoice.ts` (detailed invoice types)
- [ ] Export types from shared package

---

## Key Files to Create

```
apps/api/src/
├── modules/
│   └── billing/
│       ├── quote.model.ts
│       ├── quote.controller.ts
│       ├── quote.service.ts
│       ├── quote.routes.ts
│       ├── order.model.ts
│       ├── order.controller.ts
│       ├── order.service.ts
│       ├── order.routes.ts
│       ├── invoice.model.ts
│       ├── invoice.controller.ts
│       ├── invoice.service.ts
│       ├── invoice.routes.ts
│       ├── payment.model.ts
│       ├── payment.controller.ts
│       ├── payment.service.ts
│       ├── payment.routes.ts
│       ├── paymentAllocation.model.ts
│       ├── paymentAllocation.service.ts
│       ├── creditNote.model.ts
│       ├── creditNote.controller.ts
│       ├── creditNote.service.ts
│       ├── creditNote.routes.ts
│       ├── pdf.service.ts
│       ├── billing.routes.ts (aggregates all billing routes)
│       └── tests/
│           ├── invoice.test.ts
│           ├── payment.test.ts
│           └── paymentAllocation.test.ts

packages/shared/src/
├── types/
│   ├── billing.ts
│   └── invoice.ts
├── schemas/
│   ├── quote.schema.ts
│   ├── order.schema.ts
│   ├── invoice.schema.ts
│   ├── payment.schema.ts
│   └── creditNote.schema.ts
└── index.ts
```

---

## Implementation Checklist

- [ ] Define all billing Mongoose models with strict schemas
- [ ] Add all indexes for query optimization
- [ ] Create service classes with CRUD operations for all entities
- [ ] Implement MongoDB transactions for payment allocation
- [ ] Implement MongoDB transactions for credit note application
- [ ] Create controllers with request validation
- [ ] Create route handlers with RBAC middleware
- [ ] Implement billing summary aggregation
- [ ] Scaffold PDF generation service
- [ ] Create Zod validation schemas
- [ ] Implement invoice number generation service with atomic sequence and duplicate protection
- [ ] Define and enforce single monetary rounding strategy: banker's rounding (round half to even) at cents precision via shared `roundToCents`
- [ ] Write unit tests for service classes
- [ ] Write integration tests for all CRUD endpoints
- [ ] Write integration tests for payment allocation transactions
- [ ] Test invoice immutability after issued status
- [ ] Verify audit logs are recorded
- [ ] Test balance calculation logic
- [ ] Add tax-calculation unit tests for basis points conversion, line-vs-total aggregation, and tie rounding cases

---

## Dependencies
- Mongoose + MongoDB (transactions)
- Zod (validation)
- Express middleware stack from Plan 1
- Audit logging from Plan 1
- Client and Catalog entities from Plan 2
- PDF library (pdfkit or similar - scaffolded)
- S3/R2 client (scaffolded)

## Compliance and Regulatory Requirements
- [ ] PCI DSS: treat payment references as sensitive, mask logs, and enforce transport/storage protections where applicable
- [ ] GDPR + retention: define lawful basis and retention windows for financial records; support retention/deletion workflows where legally permitted
- [ ] Tax reporting: support jurisdiction-aware VAT/sales-tax reporting requirements and reproducible tax calculations
- [ ] Legal invoice numbering: enforce immutable, non-reusable legal invoice identifiers (`invoiceNo`) with audit traceability
- [ ] Financial audit trail: ensure all mutations/applications/reversals are audit-logged (Plan 1 audit module), including actor and before/after values

---

## Testing Strategy
- Unit tests for all calculations (totals, tax, balance)
- Unit tests for payment allocation logic
- Integration tests for invoice creation with tax
- Integration tests for payment allocation transaction (success and rollback)
- Integration tests for credit note application
- Integration test for invoice immutability
- Test audit logs for sensitive operations
- Test concurrent payment allocations (edge case)

---

## Definition of Done
- All billing entities have full CRUD endpoints
- Invoices are immutable after issued status
- Payment allocations use MongoDB transactions successfully
- Credit notes can be created and applied with transactions
- Billing summary endpoint returns correct aggregations
- All API responses are validated with Zod
- Audit logs record all billing mutations
- Integration tests pass with >80% coverage
- TypeScript compilation has zero errors
- PDF generation is scaffolded and callable in synchronous mode (queue async deferred to Plan 5)
- Balance calculations are accurate including tax
