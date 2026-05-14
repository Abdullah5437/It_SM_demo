import { z } from 'zod';

export const stockMovementRefSchema = z.object({
    type: z.string(),
    id: z.string()
}).optional();

export const stockMovementSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    warehouseId: z.string().min(1, 'Warehouse ID is required'),
    qtyDelta: z.number().int('Quantity delta must be an integer'),
    reason: z.enum(['purchase', 'sale', 'return', 'adjustment', 'damage', 'other']),
    ref: stockMovementRefSchema,
    createdBy: z.string().optional()
});

export const stockMovementCreateSchema = stockMovementSchema;

export type StockMovementRef = z.infer<typeof stockMovementRefSchema>;
export type StockMovement = z.infer<typeof stockMovementSchema>;
export type StockMovementCreate = z.infer<typeof stockMovementCreateSchema>;
