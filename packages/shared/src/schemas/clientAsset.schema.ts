import { z } from 'zod';

export const clientAssetPurchaseSchema = z.object({
    invoiceId: z.string().optional(),
    invoiceLineId: z.string().optional()
});

export const clientAssetSchema = z.object({
    clientId: z.string().min(1, 'Client ID is required'),
    clientSiteId: z.string().optional(),
    productId: z.string().min(1, 'Product ID is required'),
    serializedItemId: z.string().optional(),
    assetTag: z.string().min(1, 'Asset tag is required'),
    status: z.enum(['active', 'replaced', 'returned', 'retired']).default('active'),
    warrantyStart: z.date(),
    warrantyEnd: z.date(),
    purchase: clientAssetPurchaseSchema.optional(),
    createdBy: z.string().optional()
});

export const clientAssetCreateSchema = z.object({
    clientId: z.string().min(1, 'Client ID is required'),
    clientSiteId: z.string().optional(),
    productId: z.string().min(1, 'Product ID is required'),
    serializedItemId: z.string().optional(),
    assetTag: z.string().min(1, 'Asset tag is required'),
    warrantyStart: z.string().or(z.date()).pipe(z.coerce.date()),
    warrantyEnd: z.string().or(z.date()).pipe(z.coerce.date()),
    purchase: clientAssetPurchaseSchema.optional(),
    createdBy: z.string().optional()
});

export const clientAssetUpdateSchema = z.object({
    clientSiteId: z.string().optional(),
    status: z.enum(['active', 'replaced', 'returned', 'retired']).optional(),
    warrantyStart: z.string().or(z.date()).pipe(z.coerce.date()).optional(),
    warrantyEnd: z.string().or(z.date()).pipe(z.coerce.date()).optional()
});

export type ClientAssetPurchase = z.infer<typeof clientAssetPurchaseSchema>;
export type ClientAsset = z.infer<typeof clientAssetSchema>;
export type ClientAssetCreate = z.infer<typeof clientAssetCreateSchema>;
export type ClientAssetUpdate = z.infer<typeof clientAssetUpdateSchema>;
