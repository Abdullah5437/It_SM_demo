import { z } from 'zod';

const sizeSchema = z.object({
  name: z.string().min(1, 'Size name is required'),
  stock: z.number().int().nonnegative().default(0),
  salePrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
});

export const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['Mens', 'Women', 'Children', 'Other']),
  defaultSalePrice: z.number().min(0, 'Sale price must be non-negative'),
  defaultCost: z.number().min(0, 'Cost must be non-negative'),
  currency: z.string().min(1, 'Currency is required').default('PKR'),
  trackInventory: z.boolean().default(true),
  trackSerial: z.boolean().default(false),
  stock: z.number().int().nonnegative().default(0),
  sizes: z.array(sizeSchema).default([]),
  status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
});

// For create, SKU is optional — backend will auto-generate
export const productCreateSchema = productSchema.extend({
  sku: z.string().min(1, 'SKU is required').optional(),
});
export const productUpdateSchema = productSchema.partial();

export type Product = z.infer<typeof productSchema>;
export type ProductCreate = z.infer<typeof productCreateSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;