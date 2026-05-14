import { z } from 'zod';

export const stockLevelSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    warehouseId: z.string().min(1, 'Warehouse ID is required'),
    qtyOnHand: z.number().min(0, 'Quantity on hand must be non-negative').default(0),
    qtyReserved: z.number().min(0, 'Reserved quantity must be non-negative').default(0),
    reorderPoint: z.number().min(0, 'Reorder point must be non-negative').default(0),
    reorderQty: z.number().min(0, 'Reorder quantity must be non-negative').default(0)
});

export const stockLevelCreateSchema = stockLevelSchema;
export const stockLevelUpdateSchema = stockLevelSchema.partial();

export type StockLevel = z.infer<typeof stockLevelSchema>;
export type StockLevelCreate = z.infer<typeof stockLevelCreateSchema>;
export type StockLevelUpdate = z.infer<typeof stockLevelUpdateSchema>;
