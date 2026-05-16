# Plan 4: Inventory & Assets Management

**Priority**: P1  
**Duration**: ~2-3 weeks  
**Dependencies**: Plan 1 (Foundation), Plan 2 (CRM & Catalog), Plan 3 (Billing)

## Overview
Implement complete inventory management: products, warehouses, stock tracking, serialized item management, and client asset tracking with warranty and purchase history.

---

## Deliverables

### 1. Products Catalog
- [ ] Product model with fields:
  - `sku` (unique)
  - `name`, `type` (hardware, software, component, other)
  - `categoryId` (optional reference to category)
  - `defaultSalePriceCents`, `defaultCostCents`
  - `currency`
  - `trackInventory` (boolean)
  - `trackSerial` (boolean)
  - `status` (active, inactive, discontinued)
  - `description`
  - `createdAt`, `updatedAt`
- [ ] Create product endpoint (`POST /api/v1/products`)
- [ ] Read product endpoint (`GET /api/v1/products/:id`)
- [ ] Update product endpoint (`PATCH /api/v1/products/:id`)
- [ ] Delete product endpoint (`DELETE /api/v1/products/:id`)
- [ ] List products endpoint (`GET /api/v1/products?status=active&type=hardware`)
- [ ] Products indexes: `{ sku: 1 }`, `{ status: 1 }`, `{ type: 1 }`
- [ ] Audit logging for product mutations

### 2. Warehouses Management
- [ ] Warehouse model with fields:
  - `code` (unique)
  - `name`
  - `address` { street, city, state, postalCode, country }
  - `status` (active, inactive)
  - `createdAt`, `updatedAt`
- [ ] Create warehouse endpoint (`POST /api/v1/warehouses`)
- [ ] Read warehouse endpoint (`GET /api/v1/warehouses/:id`)
- [ ] Update warehouse endpoint (`PATCH /api/v1/warehouses/:id`)
- [ ] List warehouses endpoint (`GET /api/v1/warehouses?status=active`)
- [ ] Warehouses index: `{ code: 1 }`, `{ status: 1 }`
- [ ] Audit logging for warehouse mutations

### 3. Stock Levels Management
- [ ] Stock levels model with fields:
  - `productId` (reference to product)
  - `warehouseId` (reference to warehouse)
  - `qtyOnHand` (current available quantity)
  - `qtyReserved` (reserved for orders)
  - `reorderPoint` (when to reorder)
  - `reorderQty` (how many to reorder)
  - `updatedAt`
- [ ] Get stock level endpoint (`GET /api/v1/stock-levels/:id`)
- [ ] Update stock level endpoint (`PATCH /api/v1/stock-levels/:id`)
- [ ] List stock levels endpoint (`GET /api/v1/stock-levels?productId=...&warehouseId=...`)
- [ ] Stock levels are auto-created on first stock movement for (`productId`, `warehouseId`) with initial `qtyOnHand=0`, `qtyReserved=0` (idempotent on unique key)
- [ ] Stock levels indexes: `{ productId: 1, warehouseId: 1 }` (unique), `{ qtyOnHand: 1 }`
- [ ] Audit logging for stock updates (via stock movements)

### 4. Stock Movements Audit Trail
- [ ] Stock movements model with fields:
  - `productId` (reference to product)
  - `warehouseId` (reference to warehouse)
  - `qtyDelta` (positive or negative quantity change)
  - `reason` (purchase, sale, return, adjustment, damage, other)
  - `ref` { type, id } (reference to order, invoice, or asset)
  - `createdBy` (user who made the movement)
  - `createdAt`
- [ ] Create stock movement endpoint (`POST /api/v1/stock-movements`)
  - Body: `{ productId, warehouseId, qtyDelta, reason, ref }`
  - Updates stock_levels via explicit rules in the same transaction:
    - `purchase`: `qtyOnHand += qtyDelta`
    - `sale` (fulfillment): `qtyOnHand -= qtyDelta`, `qtyReserved -= qtyDelta`
    - `reserve`: `qtyReserved += qtyDelta`
    - `release`: `qtyReserved -= qtyDelta`
    - `return`: `qtyOnHand += qtyDelta`
    - `adjustment`/`damage`: explicit signed adjustment with audit reason
  - Validation: no negative `qtyOnHand`/`qtyReserved`; `qtyDelta` must be positive for reason-driven operations
  - Creates immutable movement record
  - Uses MongoDB transaction
- [ ] Read stock movement endpoint (`GET /api/v1/stock-movements/:id`)
- [ ] List stock movements endpoint (`GET /api/v1/stock-movements?productId=...&reason=sale`)
- [ ] Stock movements indexes: `{ productId: 1, warehouseId: 1, createdAt: -1 }`, `{ reason: 1 }`
- [ ] Audit logging for stock movements
- [ ] **Note**: Cannot delete stock movements; use reversal entries for corrections

### 5. Serialized Items Management
- [ ] Serialized items model with fields:
  - `serialNo` (unique)
  - `productId` (reference to product)
  - `status` (in_stock, sold, returned, scrapped, assigned)
  - `warehouseId` (reference to warehouse, null if sold/assigned)
  - `createdAt`
- [ ] Create serialized item endpoint (`POST /api/v1/serialized-items`)
  - Body: `{ serialNo, productId, warehouseId }`
  - Status defaults to in_stock
- [ ] Read serialized item endpoint (`GET /api/v1/serialized-items/:id`)
- [ ] Update serialized item endpoint (`PATCH /api/v1/serialized-items/:id`)
  - Can update status and warehouseId
- [ ] List serialized items endpoint (`GET /api/v1/serialized-items?productId=...&status=in_stock`)
- [ ] Serialized items indexes: `{ serialNo: 1 }`, `{ productId: 1, status: 1 }`, `{ warehouseId: 1 }`
- [ ] Audit logging for serialized item changes
- [ ] Serialized stock rules when `product.trackSerial=true`:
  - `qtyOnHand` = count of serialized items with `productId` and `status=in_stock`
  - `qtyReserved` tracked by reserving concrete serialized item IDs (`status=reserved` or equivalent reserved flag)
  - Stock movements for serialized products must include `serializedItemId` (or list) and validate linkage

### 6. Client Assets Management
- [ ] Client assets model with fields:
  - `clientId` (reference to client)
  - `clientSiteId` (optional reference to site)
  - `productId` (reference to product)
  - `serializedItemId` (optional reference to serialized item)
  - `assetTag` (unique)
  - `status` (active, replaced, returned, retired)
  - `warrantyStart`, `warrantyEnd` (dates)
  - `purchase` { invoiceId, invoiceLineId } (link to purchase)
  - `createdBy` (user who created asset)
  - `createdAt`
- [ ] Create client asset endpoint (`POST /api/v1/client-assets`)
  - Body: `{ clientId, clientSiteId?, productId, serializedItemId?, assetTag, warrantyStart, warrantyEnd }`
  - If serializedItemId provided, update serialized item status to assigned
  - Uses MongoDB transaction
- [ ] Read client asset endpoint (`GET /api/v1/client-assets/:id`)
- [ ] Update client asset endpoint (`PATCH /api/v1/client-assets/:id`)
- [ ] Retire asset endpoint (`POST /api/v1/client-assets/:id/retire`)
  - Set status to retired
  - Update serialized item status to scrapped
- [ ] Return asset endpoint (`POST /api/v1/client-assets/:id/return`)
  - Set status to returned
  - Update serialized item status back to in_stock
  - Update warehouse location
  - Create stock movement with `reason=return`, `qtyDelta=+1`
  - Use MongoDB transaction for status/location + movement + stock level updates
- [ ] List client assets endpoint (`GET /api/v1/client-assets?clientId=...&status=active`)
- [ ] Client assets indexes: `{ clientId: 1, status: 1 }`, `{ assetTag: 1 }`, `{ warrantyEnd: 1 }`
- [ ] Audit logging for all asset changes

### 7. Stock Allocation Workflow (Hardware Sale)
- [ ] Implement stock allocation service for hardware sales
- [ ] When invoice with product line is issued:
  1. Check stock availability (qtyOnHand >= qty)
  2. Reserve stock only (qtyReserved += qty; qtyOnHand unchanged)
  3. If serialized tracking: reserve specific serial numbers
  4. At fulfillment, create stock movement with reason: sale
  5. At fulfillment, decrement qtyOnHand by qty and decrement qtyReserved by qty atomically
  6. Create client asset record
  7. Update serialized items status/location
  8. Log audit entry
- [ ] Service method: `allocateStockForInvoice(invoiceId, lines)`
- [ ] Uses MongoDB transaction for consistency

### 8. Low Stock Alert (Scaffolded)
- [ ] Implement low stock detection service (scaffold)
- [ ] Trigger when qtyOnHand <= reorderPoint
- [ ] Log alert for admin review (for Plan 5 job processing)
- [ ] Service method: `checkLowStockLevels()`

### 9. Zod Schemas (Inventory)
- [ ] Create validation schemas in `/packages/shared/src/schemas/`:
  - `product.schema.ts`
  - `warehouse.schema.ts`
  - `stockLevel.schema.ts`
  - `stockMovement.schema.ts`
  - `serializedItem.schema.ts`
  - `clientAsset.schema.ts`
- [ ] Export schemas from shared package

### 10. TypeScript Types (Inventory)
- [ ] Create type definitions in `/packages/shared/src/types/`:
  - `inventory.ts`
  - `asset.ts`
- [ ] Export types from shared package

---

## Key Files to Create

```
apps/api/src/
├── modules/
│   └── inventory/
│       ├── product.model.ts
│       ├── product.controller.ts
│       ├── product.service.ts
│       ├── product.routes.ts
│       ├── warehouse.model.ts
│       ├── warehouse.controller.ts
│       ├── warehouse.service.ts
│       ├── warehouse.routes.ts
│       ├── stockLevel.model.ts
│       ├── stockLevel.controller.ts
│       ├── stockLevel.service.ts
│       ├── stockLevel.routes.ts
│       ├── stockMovement.model.ts
│       ├── stockMovement.controller.ts
│       ├── stockMovement.service.ts
│       ├── stockMovement.routes.ts
│       ├── serializedItem.model.ts
│       ├── serializedItem.controller.ts
│       ├── serializedItem.service.ts
│       ├── serializedItem.routes.ts
│       ├── clientAsset.model.ts
│       ├── clientAsset.controller.ts
│       ├── clientAsset.service.ts
│       ├── clientAsset.routes.ts
│       ├── stockAllocation.service.ts
│       ├── lowStockAlert.service.ts
│       ├── inventory.routes.ts (aggregates all inventory routes)
│       └── tests/
│           ├── stockMovement.test.ts
│           ├── stockAllocation.test.ts
│           └── clientAsset.test.ts

packages/shared/src/
├── types/
│   ├── inventory.ts
│   └── asset.ts
├── schemas/
│   ├── product.schema.ts
│   ├── warehouse.schema.ts
│   ├── stockLevel.schema.ts
│   ├── stockMovement.schema.ts
│   ├── serializedItem.schema.ts
│   └── clientAsset.schema.ts
└── index.ts
```

---

## Implementation Checklist

- [ ] Define all inventory Mongoose models with strict schemas
- [ ] Add all indexes for query optimization
- [ ] Create service classes with CRUD operations
- [ ] Implement stock movement tracking with transactions
- [ ] Implement serialized item status management
- [ ] Implement client asset creation and lifecycle
- [ ] Implement stock allocation service for hardware sales
- [ ] Implement low stock alert detection (scaffolded)
- [ ] Create controllers with request validation
- [ ] Create route handlers with RBAC middleware
- [ ] Create Zod validation schemas
- [ ] Write unit tests for service classes
- [ ] Write integration tests for all CRUD endpoints
- [ ] Write integration tests for stock allocation transactions
- [ ] Test serialized item status transitions
- [ ] Test client asset warranty tracking
- [ ] Verify audit logs are recorded

---

## Dependencies
- Mongoose + MongoDB (transactions)
- Zod (validation)
- Express middleware stack from Plan 1
- Audit logging from Plan 1
- Client and Catalog entities from Plan 2
- Billing entities from Plan 3

---

## Testing Strategy
- Unit tests for stock quantity calculations
- Unit tests for serialized item status transitions
- Integration tests for stock movement creation and tracking
- Integration tests for stock allocation with transactions
- Integration tests for client asset creation and lifecycle
- Integration tests for low stock detection
- Test concurrent stock movements (edge case)
- Test warranty date calculations

---

## Definition of Done
- All inventory entities have full CRUD endpoints
- Stock movements create immutable audit trail
- Stock allocation uses transactions for consistency
- Serialized items track lifecycle correctly
- Client assets link to purchase history and warranty
- All API responses are validated with Zod
- Audit logs record all inventory mutations
- Integration tests pass with >80% coverage
- TypeScript compilation has zero errors
- Low stock detection is functional and scaffolded
