import { z } from 'zod';

// User creation schema (local copy for module-specific validation)
export const createUserSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8),
  roles: z.array(
    z.enum(['admin', 'accounts', 'support', 'sales', 'user'])
  ).default(['user']),
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

// User status change schema
export const userStatusChangeSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended']),
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

// User list query schema
export const userListQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).default('1'),
  limit: z.string().transform(val => parseInt(val, 10)).default('10'),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  role: z.enum(['admin', 'accounts', 'support', 'sales', 'user']).optional(),
  search: z.string().optional(),
});

export type UserCreate = z.infer<typeof createUserSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type UserStatusChange = z.infer<typeof userStatusChangeSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;