import { z } from 'zod';

export const subSubcategorySchema = z.object({
  name: z.string().min(1, 'Sub-subcategory name is required'),
  description: z.string().optional(),
});

export type SubSubcategory = z.infer<typeof subSubcategorySchema>;

export const subcategorySchema = z.object({
  name: z.string().min(1, 'Subcategory name is required'),
  description: z.string().optional(),
  subSubcategories: z.array(subSubcategorySchema).default([]),
});

export type Subcategory = z.infer<typeof subcategorySchema>;

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  type: z.enum(['hardware', 'software', 'component', 'other']).optional(),
  subcategories: z.array(subcategorySchema).default([]),
});

export const categoryCreateSchema = categorySchema;
export const categoryUpdateSchema = categorySchema.partial();

export type Category = z.infer<typeof categorySchema>;
export type CategoryCreate = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;