import { z } from 'zod';

const variantSchema = z.object({
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().optional(),
  stock: z.number().int().nonnegative().default(0),
  salePrice: z.number().min(0).default(0),
  costPrice: z.number().min(0).default(0),
});

export const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  type: z.enum(['hardware', 'software', 'component', 'other']),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  subsubcategory: z.string().optional(),
  categoryId: z.string().optional(),
  defaultSalePrice: z.number().min(0, 'Sale price must be non-negative'),
  defaultCost: z.number().min(0, 'Cost must be non-negative'),
  currency: z.string().min(1, 'Currency is required').default('USD'),
  trackInventory: z.boolean().default(true),
  trackSerial: z.boolean().default(false),
  stock: z.number().int().nonnegative().default(0),
  variants: z.array(variantSchema).default([]),
  status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
});

export const productCreateSchema = productSchema;
export const productUpdateSchema = productSchema.partial();

export type Product = z.infer<typeof productSchema>;
export type ProductCreate = z.infer<typeof productCreateSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;