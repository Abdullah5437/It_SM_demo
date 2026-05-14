import { z } from 'zod';

// Payment Create Schema
export const paymentCreateSchema = z.object({
  clientId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  paymentDate: z.string().datetime(),
  method: z.enum(['card', 'bank_transfer', 'check', 'cash', 'credit']),
  reference: z.string().min(1),
  amountCents: z.number().positive(),
  currency: z.string().length(3).toUpperCase(),
});

export type PaymentCreate = z.infer<typeof paymentCreateSchema>;

// Payment Response Schema
export const paymentResponseSchema = z.object({
  _id: z.string(),
  clientId: z.string(),
  paymentDate: z.date(),
  method: z.enum(['card', 'bank_transfer', 'check', 'cash', 'credit']),
  reference: z.string(),
  amountCents: z.number().positive(),
  currency: z.string(),
  status: z.enum(['pending', 'confirmed', 'failed', 'cancelled']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PaymentResponse = z.infer<typeof paymentResponseSchema>;

// Payment Allocation Create Schema
export const paymentAllocationCreateSchema = z.object({
  invoiceId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  amountCents: z.number().positive(),
});

export type PaymentAllocationCreate = z.infer<typeof paymentAllocationCreateSchema>;

// Payment Allocation Response Schema
export const paymentAllocationResponseSchema = z.object({
  _id: z.string(),
  paymentId: z.string(),
  invoiceId: z.string(),
  amountCents: z.number().positive(),
  createdAt: z.date(),
});

export type PaymentAllocationResponse = z.infer<typeof paymentAllocationResponseSchema>;
