# Plan 8: Email, Communications & Reporting

**Priority**: P2  
**Duration**: ~3 weeks  
**Dependencies**: Plan 1 (Foundation), Plan 3 (Billing), Plan 5 (BullMQ), Plan 7 (Support)

## Overview
Implement email template management, transactional email sending via BullMQ, comprehensive email logging, dunning workflows for overdue invoices, and foundational reporting endpoints.

---

## Deliverables

### 1. Email Templates Management
- [ ] Email templates model with fields:
  - `name` (unique)
  - `category` (invoice, receipt, dunning, trial_expiration, renewal_reminder, support, onboarding, other)
  - `subject`
  - `bodyHtml`
  - `bodyText`
  - `variables` (array of template variables: {{ clientName }}, {{ invoiceNo }}, etc.)
  - `createdAt`, `updatedAt`
- [ ] Create email template endpoint (`POST /api/v1/email-templates`)
  - Body: `{ name, category, subject, bodyHtml, bodyText }`
- [ ] Read email template endpoint (`GET /api/v1/email-templates/:id`)
- [ ] Update email template endpoint (`PATCH /api/v1/email-templates/:id`)
- [ ] Delete email template endpoint (`DELETE /api/v1/email-templates/:id`)
- [ ] List email templates endpoint (`GET /api/v1/email-templates?category=invoice`)
- [ ] Email templates indexes: `{ name: 1 }`, `{ category: 1 }`
- [ ] Audit logging for template mutations
- [ ] Security: use auto-escaping template engine (Handlebars) for render-time substitution
- [ ] Document allowed raw variables vs escaped variables; raw HTML rendering only when explicitly flagged/reviewed
- [ ] Validate/sanitize user-supplied template fields (`name`, `subject`, `bodyHtml`, `bodyText`, `variables`) on POST/PATCH

### 2. Email Messages Tracking (Logs)
- [ ] Email messages model with fields:
  - `clientId` (reference to client)
  - `contactId` (optional reference to client contact)
  - `templateId` (optional reference to email template)
  - `toEmail` (recipient email)
  - `subject`, `bodyHtml`, `bodyText`
  - `status` (pending, sent, failed, bounced, opened, clicked)
  - `providerMessageId` (ID from email provider)
  - `related` { type, id } (invoice, ticket, subscription, etc.)
  - `sentAt`, `openedAt`, `clickedAt`
  - `error` (error message if failed)
  - `metadata` (optional: tracking pixels, etc.)
  - `createdAt`
- [ ] Create email message endpoint (internal, for logging)
- [ ] Read email message endpoint (`GET /api/v1/email-messages/:id`)
- [ ] List email messages endpoint (`GET /api/v1/email-messages?clientId=...&status=sent`)
- [ ] Email messages indexes: `{ clientId: 1, createdAt: -1 }`, `{ status: 1 }`, `{ toEmail: 1 }`
- [ ] Audit logging for email send attempts
- [ ] Retention policy (configurable): retain for X years or Y after client relationship end; implement scheduled purge job
- [ ] Consent tracking for opens/clicks/metadata storage, including audit trail of consent decisions
- [ ] Add preference management deliverables (`opt-in/opt-out`, unsubscribe events such as `unsubscribeAt`)
- [ ] Privacy controls: encryption at rest for sensitive fields, RBAC for content access, and access logging for reads
- [ ] Add retention/consent filtering requirements to list/read endpoints and related indexes

### 3. Email Provider Integration
- [ ] Support multiple email providers (scaffold):
  - SendGrid
  - Mailgun
  - SMTP (generic)
- [ ] Environment variables:
  - EMAIL_PROVIDER (sendgrid | mailgun | smtp)
  - SENDGRID_API_KEY (if SendGrid)
  - MAILGUN_API_KEY, MAILGUN_DOMAIN (if Mailgun)
  - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD (if SMTP)
  - FROM_EMAIL (default sender)
  - FROM_NAME (default sender name)
- [ ] Secret rotation and revocation process for provider credentials (cadence + rollout)
- [ ] Secret-manager integration (AWS Secrets Manager/Vault) and runtime secret reference pattern
- [ ] Create email provider service interface:
  - `sendEmail({ to, subject, html, text, metadata? })`
  - Returns: `{ messageId, status }`
- [ ] Implement SendGrid adapter (scaffolded)
- [ ] Implement Mailgun adapter (scaffolded)
- [ ] Implement SMTP adapter (scaffolded)
- [ ] Provider error handling and logging
- [ ] Provider rate-limit controls per adapter (quota/header aware), exponential backoff, and queue backpressure
- [ ] Monitoring/alerts for quota usage and throttling metrics

### 4. Email Sending via BullMQ
- [ ] Create emailQueue in BullMQ
- [ ] Implement worker: `emailWorker`
  - Job input: `{ emailMessageId }` or `{ to, subject, html, text, related? }`
  - Steps:
    1. Load or create email message record
    2. Log as pending
    3. Call email provider
    4. On success: update status to sent, set sentAt, set providerMessageId
    5. On failure: update status to failed, set error message, log retry
    6. Log audit entry
  - Idempotency: use emailMessageId + hash
  - Retries: exponential backoff (5 retries with increasing delay)
  - Dead letter queue for failed emails after max retries
- [ ] Enqueue email: `emailQueue.add({ ... }, { jobId, attempts, delay })`
- [ ] Test with mock email provider

### 5. Send Invoice Email
- [ ] Implement endpoint: `POST /api/v1/invoices/:id/send-email`
  - Body: `{ toEmail?, templateId? }`
  - Load invoice and client
  - Use templateId or default invoice template
  - Render template with invoice variables: invoiceNo, issueDate, dueDate, totalCents, balanceCents, clientName
  - Optionally include PDF attachment (if generated)
  - Create email message record
  - Enqueue emailWorker job
  - Return email message ID and status
- [ ] Idempotency: use invoice ID + recipient email hash to avoid duplicate sends
- [ ] Webhook handling for email provider events (delivered, opened, bounced)

### 6. Dunning Workflow (Overdue Invoices)
- [ ] Implement dunning queue: `dunningQueue`
- [ ] Create dunning worker: `dunningWorker`
  - Job input: `{ clientId }` or run for all clients
  - Steps:
    1. Find overdue invoices (dueDate < today, balanceCents > 0)
    2. Categorize by age: 1-7 days, 8-14 days, 15-30 days, 30+ days
    3. Load dunning template for age category
    4. Get client primary contact(s)
    4.1 Honor contact preferences/unsubscribe settings before enqueue
    5. For each contact: enqueue emailWorker with dunning template
    6. Log dunning email sent
    7. Update client.denormalizedCounters.overdueBalanceCents if not already
  - Retries: standard retry logic
  - Throttle: max 1 dunning email per client per day
- [ ] Dunning compliance requirements:
  - Include CAN-SPAM required elements in all templates (sender identity, physical address, accurate subject, opt-out link)
  - Record GDPR legitimate-interest reference and consent/preference flags for each dunning message
  - Add test/monitoring hooks that log compliance metadata on queue/send and surface key flags in status APIs
- [ ] Dunning email templates (scaffold):
  - First notice: gentle reminder
  - Second notice: firm reminder
  - Third notice: final notice before action
  - Collection notice: legal/collection action
- [ ] Endpoint: `POST /api/v1/billing/dunning/run` (admin only)
  - Enqueue dunning worker for all clients with overdue invoices
  - Return count of dunning emails queued
- [ ] Endpoint: `GET /api/v1/billing/dunning/status?clientId=...`
  - Returns dunning status per client

### 7. Transactional Email Templates
- [ ] Pre-create default templates in DB seed:
  - Invoice issued: "Invoice {invoiceNo} issued on {issueDate}"
  - Payment received: "Payment of {amountCents} received"
  - Subscription renewed: "Subscription {subscriptionId} renewed"
  - Trial expiring: "Your trial expires in {daysLeft} days"
  - Support ticket opened: "Ticket {ticketNo}: {subject}"
  - Support ticket resolved: "Ticket {ticketNo} resolved"
- [ ] Endpoint: `POST /api/v1/email-templates/send-test`
  - Body: `{ templateId, toEmail, variables? }`
  - Renders template and sends test email to toEmail
  - For template development and testing

### 8. Email Statistics & Dashboard
- [ ] Endpoint: `GET /api/v1/email-messages/stats?clientId=...&period=2025-01`
  - Returns: totalSent, totalFailed, totalOpened, totalClicked
- [ ] Endpoint: `GET /api/v1/email-templates/usage`
  - Returns: usage stats per template (times sent, success rate)
- [ ] Email audit trail: `GET /api/v1/email-messages?clientId=...&sort=createdAt`

### 9. Webhook Handling (Email Provider Events)
- [ ] Implement webhook endpoints for email provider events:
  - `POST /webhooks/email/sendgrid` (SendGrid delivery events)
  - `POST /webhooks/email/mailgun` (Mailgun delivery events)
- [ ] Handle events:
  - delivered: update email message status
  - opened: update openedAt, set status to opened
  - clicked: update clickedAt
  - bounced: update status to bounced, mark contact as invalid
  - complained: update status to bounced
- [ ] Webhook verification and security:
  - Verify webhook signature from provider
  - Prevent replay attacks with timestamp validation
- [ ] Log all webhook events

### 10. Attachments Support (Files)
- [ ] File upload endpoints (scaffold):
  - `POST /api/v1/files/upload` - upload file
  - `GET /api/v1/files/:id/download` - download file
- [ ] Attachments model (basic):
  - `clientId`, `related` { type, id }
  - `fileName`, `mimeType`, `storageKey` (S3/R2)
  - `sizeBytes`, `uploadedBy`, `uploadedAt`
- [ ] Store files in S3/R2 (scaffold)
- [ ] Support file attachments in email sending (optional: for Plan 8)

### 11. Email Module Routes
- [ ] Aggregate all email routes in `/modules/email/email.routes.ts`
- [ ] Include: templates, messages, send invoice, dunning, webhooks

### 12. Zod Schemas (Email)
- [ ] Create validation schemas in `/packages/shared/src/schemas/`:
  - `emailTemplate.schema.ts`
  - `emailMessage.schema.ts`
  - `sendEmailJob.schema.ts`
- [ ] Export schemas from shared package

### 13. TypeScript Types (Email)
- [ ] Create type definitions in `/packages/shared/src/types/`:
  - `email.ts` (template, message)
  - `emailProvider.ts` (provider interfaces)
- [ ] Export types from shared package

---

## Key Files to Create

```
apps/api/src/
├── modules/
│   ├── email/
│   │   ├── emailTemplate.model.ts
│   │   ├── emailTemplate.controller.ts
│   │   ├── emailTemplate.service.ts
│   │   ├── emailTemplate.routes.ts
│   │   ├── emailMessage.model.ts
│   │   ├── emailMessage.controller.ts
│   │   ├── emailMessage.service.ts
│   │   ├── emailMessage.routes.ts
│   │   ├── emailProvider.ts (interface)
│   │   ├── providers/
│   │   │   ├── sendgridProvider.ts
│   │   │   ├── mailgunProvider.ts
│   │   │   └── smtpProvider.ts
│   │   ├── emailRendering.service.ts
│   │   ├── email.routes.ts (aggregates routes)
│   │   └── tests/
│   │       ├── emailTemplate.test.ts
│   │       └── emailRendering.test.ts
│   └── files/ (scaffold)
│       ├── attachment.model.ts
│       ├── attachment.controller.ts
│       ├── attachment.service.ts
│       ├── attachment.routes.ts
│       └── s3.service.ts (placeholder)
├── jobs/
│   └── workers/
│       ├── emailWorker.ts
│       ├── dunningWorker.ts
│       └── tests/
│           ├── emailWorker.test.ts
│           └── dunningWorker.test.ts
├── webhooks/
│   ├── emailWebhooks.ts
│   └── webhookVerification.service.ts

packages/shared/src/
├── types/
│   ├── email.ts
│   └── emailProvider.ts
├── schemas/
│   ├── emailTemplate.schema.ts
│   ├── emailMessage.schema.ts
│   └── sendEmailJob.schema.ts
└── index.ts
```

---

## Implementation Checklist

- [ ] Define email template Mongoose model
- [ ] Define email message Mongoose model
- [ ] Define attachment Mongoose model (scaffold)
- [ ] Add all indexes for query optimization
- [ ] Create email template service with CRUD
- [ ] Create email message service with logging
- [ ] Implement email provider interface
- [ ] Implement SendGrid provider adapter (scaffold)
- [ ] Implement Mailgun provider adapter (scaffold)
- [ ] Implement SMTP provider adapter (scaffold)
- [ ] Create email rendering service (template variable substitution)
- [ ] Setup BullMQ email queue
- [ ] Implement email worker
- [ ] Implement dunning worker
- [ ] Create invoice send-email endpoint
- [ ] Implement webhook handlers for email events
- [ ] Create controllers with request validation
- [ ] Create route handlers with RBAC middleware
- [ ] Create Zod validation schemas
- [ ] Write unit tests for email rendering
- [ ] Write integration tests for email sending (with mock provider)
- [ ] Write integration tests for email worker
- [ ] Write integration tests for dunning worker
- [ ] Write integration tests for webhooks
- [ ] Test email idempotency
- [ ] Test retry logic and dead letter queue
- [ ] Verify audit logs are recorded
- [ ] Test template variable substitution

---

## Dependencies
- Mongoose + MongoDB
- Zod (validation)
- Express middleware stack from Plan 1
- Audit logging from Plan 1
- BullMQ + Redis
- Client entities from Plan 2
- Billing entities from Plan 3
- Support entities from Plan 7
- Email provider libraries (sendgrid, mailgun, nodemailer)
- Handlebars (template rendering with HTML auto-escaping by default)
- S3/R2 client (for files, scaffold)

---

## Testing Strategy
- Unit tests for email template rendering with variables
- Unit tests for email provider adapters (mock HTTP calls)
- Unit tests for dunning logic (categorize overdue invoices)
- Integration tests for email worker (mock provider)
- Integration tests for dunning worker
- Integration tests for webhook handlers
- Integration tests for invoice send-email endpoint
- Test email idempotency (re-send same job)
- Test retry logic and exponential backoff
- Test max retry and dead letter queue
- Test webhook signature verification
- Test template variable substitution with various data types

---

## Definition of Done
- Email templates can be created and managed
- Email messages are sent via BullMQ worker
- Email provider integration works (with scaffolded adapters)
- Invoices can be sent via email
- Dunning workflow automatically sends overdue reminders
- Email delivery events are tracked (webhooks)
- All API responses are validated with Zod
- Audit logs record all email send attempts
- Integration tests pass with >80% coverage
- TypeScript compilation has zero errors
- Email worker is resilient with retry logic
- Template rendering handles all common variables correctly
