import { z } from 'zod';

// User creation schema
export const userCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roles: z.array(z.enum(['admin', 'accounts', 'support', 'sales', 'user'])).default(['user']),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
});

// User update schema (all fields optional)
export const userUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255).optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  roles: z.array(z.enum(['admin', 'accounts', 'support', 'sales', 'user'])).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

// User response schema (without password)
export const userResponseSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string().email(),
  roles: z.array(z.enum(['admin', 'accounts', 'support', 'sales', 'user'])),
  status: z.enum(['active', 'inactive', 'suspended']),
  lastLoginAt: z.date().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
