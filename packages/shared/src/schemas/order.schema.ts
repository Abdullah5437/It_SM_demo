import { z } from 'zod';
import { quoteLineItemSchema } from './quote.schema';

// Order Line Item Schema (same structure as quote)
export const orderLineItemSchema = quoteLineItemSchema;
export type OrderLineItem = z.infer<typeof orderLineItemSchema>;

// Order Create Schema
export const orderCreateSchema = z.object({
  clientId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  currency: z.string().length(3).toUpperCase(),
  lines: z.array(orderLineItemSchema).min(1),
  quoteId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

export type OrderCreate = z.infer<typeof orderCreateSchema>;

// Order Update Schema
export const orderUpdateSchema = z.object({
  clientName: z.string().min(1).optional(),
  clientEmail: z.string().email().optional(),
  orderDate: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  currency: z.string().length(3).toUpperCase().optional(),
  lines: z.array(orderLineItemSchema).optional(),
});

export type OrderUpdate = z.infer<typeof orderUpdateSchema>;

// Order Response Schema
export const orderResponseSchema = z.object({
  _id: z.string(),
  orderNo: z.string(),
  clientId: z.string(),
  quoteId: z.string().optional(),
  orderDate: z.date(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  currency: z.string(),
  lines: z.array(orderLineItemSchema),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OrderResponse = z.infer<typeof orderResponseSchema>;
