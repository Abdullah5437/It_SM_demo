# Implementation Plans Index

## Overview

This directory contains comprehensive implementation plans for the I-ITSM project, broken down into 8 focused sprints. Each plan includes detailed deliverables, file structures, implementation checklists, and acceptance criteria.

---

## Complete Plans

### [Plan 1: Foundation & Infrastructure](../../.github/plans/plan-01-foundation-infrastructure.md)
**Status**: COMPLETED  
**Priority**: P0  
**Duration**: 2-3 weeks  

Establishes core infrastructure including monorepo setup, database configuration, authentication framework, and middleware stack. **This plan is fully implemented.**

**Key Deliverables**:
- Monorepo structure (apps/api, apps/web, packages/shared)
- MongoDB and Redis setup
- JWT authentication and RBAC
- Audit logging framework
- Error handling and validation
- Docker Compose configuration

**Related Files**:
- [plan-1-complete.md](./plan-1-complete.md) - Completion details
- [implementation-checklist.md](./implementation-checklist.md) - Item-by-item checklist

---

### [Plan 2: CRM & Catalog Foundation](../../.github/plans/plan-02-crm-catalog-foundation.md)
**Status**: COMPLETED  
**Priority**: P0  
**Duration**: 2-3 weeks  

Core business entities including client profiles, contact management, sites, and complete service catalog. Implements critical holdings aggregation endpoint. **This plan is fully implemented.**

**Key Deliverables**:
- Client management (create, read, update, delete, list)
- Client contacts and sites (full CRUD)
- Service groups, services, plans, addons (full CRUD)
- Client holdings aggregation endpoint
- Zod validation schemas in shared package
- TypeScript types exported from shared package
- 31 REST API endpoints with RBAC middleware
- All Mongoose models with indexes

**Related Files**:
- [plan-2-complete.md](./plan-2-complete.md) - Completion details

**Depends On**: Plan 1 

---

### [Plan 3: Billing & Invoicing Core](../../.github/plans/plan-03-billing-invoicing-core.md)
**Status**: COMPLETED  
**Priority**: P1  
**Duration**: 3 weeks  
**Completion Date**: January 28, 2026  

Complete billing workflows including quotes, orders, invoices (immutable snapshots), payments with allocations, and credit notes. Establishes transactional consistency for payment operations.

**Key Deliverables**:
- Quote management
- Order management
- Invoice creation (immutable lines)
- Payment tracking
- Payment allocations (with MongoDB transactions)
- Credit note workflow
- PDF generation (scaffolded)
- Billing summary endpoints
- 31 REST API endpoints with RBAC middleware
- All Mongoose models with indexes

**Related Files**:
- [plan-3-complete.md](./plan-3-complete.md) - Completion details

**Depends On**: Plan 1 , Plan 2 

---

### [Plan 4: Inventory & Assets Management](../../.github/plans/plan-04-inventory-assets-management.md)
**Status**: COMPLETED  
**Priority**: P1  
**Duration**: 2-3 weeks  
**Completion Date**: February 04, 2026  

Complete inventory management including products, warehouses, stock levels, serialized item tracking, client assets with warranty, transactional stock allocation, low-stock alerts scaffold, and `/api/v1/inventory` alias.

**Key Deliverables**:
- Product catalog with serialization support
- Warehouse management
- Stock level tracking
- Stock movements (immutable audit trail)
- Serialized items lifecycle
- Client assets with purchase history and warranty
- Stock allocation workflow for hardware sales
- Low stock alerts (scaffolded)

**Related Files**:
- [plan-4-complete.md](./plan-4-complete.md) - Completion details
- [implementation-checklist.md](./implementation-checklist.md) - Plan 4 checklist section

**Depends On**: Plan 1, Plan 2, Plan 3

---

### [Plan 5: Subscriptions & Recurring Billing](../../.github/plans/plan-05-subscriptions-recurring-billing.md)
**Status**: READY TO START  
**Priority**: P1  
**Duration**: 3 weeks  

Subscription management with lifecycle tracking, recurring invoice generation, and BullMQ integration for automated billing. First plan to implement job queue workers.

**Key Deliverables**:
- Client subscriptions with lifecycle
- Subscription billing calculation service
- Subscription billing worker (BullMQ)
- Scheduled subscription billing trigger
- Trial period management (scaffolded)
- Renewal management
- Proration logic (scaffolded)
- BullMQ infrastructure setup
- Worker orchestration

**Depends On**: Plan 1, Plan 2, Plan 3, (Plan 4 optional)

---

### [Plan 6: VoIP/MOR Integration & Usage Billing](../../.github/plans/plan-06-voip-mor-integration.md)
**Status**: READY TO START  
**Priority**: P2  
**Duration**: 3-4 weeks  

Integration with MOR (Kolmisoft) for Cloud Phone services including service instance management, usage snapshots, and usage-based invoicing. Fully scaffolded with local mocks for development.

**Key Deliverables**:
- MOR integration layer (client, types, endpoints, mappers, errors, mocks)
- VoIP MOR accounts (system configuration)
- VoIP service instances management
- VoIP usage periods (monthly snapshots)
- MOR usage sync worker
- Invoice creation from usage periods
- VoIP management endpoints
- Zod schemas and types

**Depends On**: Plan 1, Plan 2, Plan 3, Plan 5

---

### [Plan 7: Support & Time Tracking](../../.github/plans/plan-07-support-time-tracking.md)
**Status**: READY TO START  
**Priority**: P2  
**Duration**: 2-3 weeks  

Support contracts, ticket management with SLA tracking, and billable time entry management. Links time entries to invoices for billable support services.

**Key Deliverables**:
- Support contract management
- Ticket management with SLA tracking
- SLA calculation and monitoring
- Time entry tracking
- Time billing calculations
- Invoice creation from time entries
- Support dashboard endpoints

**Depends On**: Plan 1, Plan 2, Plan 3

---

### [Plan 8: Email, Communications & Reporting](../../.github/plans/plan-08-email-communications-reporting.md)
**Status**: READY TO START  
**Priority**: P2  
**Duration**: 3 weeks  

Email template management, transactional email sending via BullMQ, comprehensive email logging, dunning workflows for overdue invoices, and foundational reporting endpoints.

**Key Deliverables**:
- Email templates management
- Email messages tracking (logs)
- Email provider integration (SendGrid, Mailgun, SMTP)
- Email sending via BullMQ worker
- Send invoice email endpoint
- Dunning workflow for overdue invoices
- Transactional email templates (pre-created)
- Email statistics and dashboard
- Webhook handling for email provider events
- File attachments support (scaffold)

**Depends On**: Plan 1, Plan 3, Plan 5, Plan 7

---

## Document Types

### Implementation Plans (`.github/plans/*.md`)
Each plan includes:
- Overview and context
- Detailed deliverables with checkboxes
- Key files to create (with folder structure)
- Implementation checklist (20-30+ items)
- Dependencies
- Testing strategy
- Definition of Done criteria

### Status Documents
- **plan-1-complete.md** - Completion details and summary
- **implementation-checklist.md** - Item-by-item checklist for Plan 1

---

## Implementation Timeline

| Plan | Priority | Duration | Status | Start | End |
|------|----------|----------|--------|-------|-----|
| 1: Foundation | P0 | 2-3 wks |  Complete | Jan 28 | Feb 11 |
| 2: CRM & Catalog | P0 | 2-3 wks |  Complete | Feb 12 | Feb 25 |
| 3: Billing | P1 | 3 wks |  Complete | Jan 08 | Jan 28 |
| 4: Inventory | P1 | 2-3 wks |  Complete | Jan 29 | Feb 04 |
| 5: Subscriptions | P1 | 3 wks |  Ready | TBD | TBD |
| 6: VoIP/MOR | P2 | 3-4 wks |  Ready | TBD | TBD |
| 7: Support | P2 | 2-3 wks |  Ready | TBD | TBD |
| 8: Email | P2 | 3 wks |  Ready | TBD | TBD |

**Total**: ~20 weeks (5 months) - 4 completed, 4 in queue

---

## Dependency Graph

```
Plan 1: Foundation 
    
     Plan 2: CRM & Catalog
        Plan 3: Billing
           Plan 4: Inventory
           Plan 5: Subscriptions
              Plan 6: VoIP/MOR
              Plan 8: Email
           Plan 7: Support
               Plan 8: Email
        Plan 7: Support
            Plan 8: Email
     Plan 5: Subscriptions (via jobs framework)
```

**Critical Path**: Plan 1  Plan 2  Plan 3  Plans 4,5,6,7 (parallel)  Plan 8

---

## How to Use These Plans

### For Project Managers
1. Reference timeline and dependencies
2. Use checklists to track progress
3. Adjust timelines based on team capacity
4. Monitor Definition of Done criteria

### For Developers
1. Read plan overview
2. Review deliverables and file structure
3. Follow implementation checklist
4. Write code per specifications
5. Verify against Definition of Done
6. Check tests pass

### For QA/Testing
1. Review test strategy section
2. Verify all endpoints per API spec
3. Test error scenarios
4. Validate audit logging
5. Test database transactions
6. Performance testing (later plans)

---

## Key Features by Plan

| Feature | Plan | Details |
|---------|------|---------|
| Authentication | 1 | JWT + RBAC |
| Client Management | 2 | Full CRUD + holdings |
| Billing | 3 | Invoices, payments, allocations |
| Inventory | 4 | Stock, assets, serialization |
| Subscriptions | 5 | Lifecycle, recurring billing |
| VoIP | 6 | MOR integration, usage billing |
| Support | 7 | Tickets, SLA, time tracking |
| Email | 8 | Templates, dunning, webhooks |

---

## Related Documentation

- **README.md** - General project documentation
- **.env.example** - Environment variables template

---

## Getting Started

### Start with the current plan set
```bash
npm install
docker-compose up -d
npm run db:seed
cd apps/api && npm run dev
```

### Next: continue with active backlog items
1. Read `../../.github/plans/plan-05-subscriptions-recurring-billing.md`
2. Follow implementation checklist
3. Create files per specifications
4. Write and pass tests
5. Verify Definition of Done

---

## Questions?

- See **README.md** for general questions
- See **PLAN.md** for project scope questions
- See individual plan files for specific feature questions
- See **IMPLEMENTATION-CHECKLIST.md** for progress tracking

---

**Last Updated**: May 2, 2026  
**Plan 1 Status**: COMPLETED  
**Plan 2 Status**: COMPLETED  
**Plan 3 Status**: COMPLETED  
**Plan 4 Status**: COMPLETED  
**Ready for Plan 5**: YES  
