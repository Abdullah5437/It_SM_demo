import { z } from 'zod';

export const warehouseAddressSchema = z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required')
});

export const warehouseSchema = z.object({
    code: z.string().min(1, 'Warehouse code is required'),
    name: z.string().min(1, 'Warehouse name is required'),
    address: warehouseAddressSchema,
    status: z.enum(['active', 'inactive']).default('active')
});

export const warehouseCreateSchema = warehouseSchema;
export const warehouseUpdateSchema = warehouseSchema.partial();

export type WarehouseAddress = z.infer<typeof warehouseAddressSchema>;
export type Warehouse = z.infer<typeof warehouseSchema>;
export type WarehouseCreate = z.infer<typeof warehouseCreateSchema>;
export type WarehouseUpdate = z.infer<typeof warehouseUpdateSchema>;
