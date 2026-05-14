import { Document } from 'mongoose';

// Inventory Types
export interface Product extends Document {
    sku: string;
    name: string;
    type: 'hardware' | 'software' | 'component' | 'other';
    categoryId?: string;
    defaultSalePriceCents: number;
    defaultCostCents: number;
    currency: string;
    trackInventory: boolean;
    trackSerial: boolean;
    status: 'active' | 'inactive' | 'discontinued';
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface StockLevel extends Document {
    productId: string;
    warehouseId: string;
    qtyOnHand: number;
    qtyReserved: number;
    reorderPoint: number;
    reorderQty: number;
    updatedAt: Date;
}

export interface StockMovementRef {
    type: string;
    id: string;
}

export interface StockMovement extends Document {
    productId: string;
    warehouseId: string;
    qtyDelta: number;
    reason: 'purchase' | 'sale' | 'return' | 'adjustment' | 'damage' | 'other';
    ref?: StockMovementRef;
    createdBy?: string;
    createdAt: Date;
}

export interface SerializedItem extends Document {
    serialNo: string;
    productId: string;
    status: 'in_stock' | 'sold' | 'returned' | 'scrapped' | 'assigned';
    warehouseId?: string | null;
    createdAt: Date;
}

export interface Warehouse extends Document {
    code: string;
    name: string;
    address: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}

// Query and Filter Types
export interface StockLevelFilters {
    productId?: string;
    warehouseId?: string;
    status?: string;
}

export interface StockMovementFilters {
    productId?: string;
    warehouseId?: string;
    reason?: string;
    createdAfter?: Date;
    createdBefore?: Date;
}

export interface InventoryStats {
    totalProducts: number;
    activeProducts: number;
    totalWarehouses: number;
    totalStockValue: number;
    lowStockItems: StockLevel[];
}

// Aggregate Types
export interface StockValuation {
    productId: string;
    totalQuantity: number;
    totalValue: number;
    lastUpdated: Date;
}
