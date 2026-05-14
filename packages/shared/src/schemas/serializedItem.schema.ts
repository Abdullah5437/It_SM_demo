import { z } from 'zod';

export const serializedItemSchema = z.object({
    serialNo: z.string().min(1, 'Serial number is required'),
    productId: z.string().min(1, 'Product ID is required'),
    status: z.enum(['in_stock', 'sold', 'returned', 'scrapped', 'assigned']).default('in_stock'),
    warehouseId: z.string().nullable().optional()
});

export const serializedItemCreateSchema = z.object({
    serialNo: z.string().min(1, 'Serial number is required'),
    productId: z.string().min(1, 'Product ID is required'),
    warehouseId: z.string().min(1, 'Warehouse ID is required')
});

export const serializedItemUpdateSchema = z.object({
    status: z.enum(['in_stock', 'sold', 'returned', 'scrapped', 'assigned']).optional(),
    warehouseId: z.string().nullable().optional()
});

export type SerializedItem = z.infer<typeof serializedItemSchema>;
export type SerializedItemCreate = z.infer<typeof serializedItemCreateSchema>;
export type SerializedItemUpdate = z.infer<typeof serializedItemUpdateSchema>;
