import { z } from 'zod';

// Quote Line Item Schema
export const quoteLineItemSchema = z.object({
  lineNo: z.number().positive(),
  itemType: z.enum(['product', 'service', 'addon', 'other']),
  description: z.string().min(1),
  qty: z.number().positive(),
  unitPriceCents: z.number().nonnegative(),
  taxRateBps: z.number().nonnegative(),
  lineTotalCents: z.number().nonnegative(),
  productId: z.string().optional(),
  variantName: z.string().optional(),
  servicePlanId: z.string().optional(),
  serviceAddonId: z.string().optional(),
});

export type QuoteLineItem = z.infer<typeof quoteLineItemSchema>;

// Quote Totals Schema
export const quoteTotalsSchema = z.object({
  subTotalCents: z.number().nonnegative(),
  taxCents: z.number().nonnegative(),
  totalCents: z.number().nonnegative(),
});

export type QuoteTotals = z.infer<typeof quoteTotalsSchema>;

// Quote Create Schema
export const quoteCreateSchema = z.object({
  clientId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  issueDate: z.string().datetime(),
  validUntil: z.string().datetime(),
  currency: z.string().length(3).toUpperCase(),
  lines: z.array(quoteLineItemSchema).min(1),
});

export type QuoteCreate = z.infer<typeof quoteCreateSchema>;

// Quote Update Schema
export const quoteUpdateSchema = z.object({
  issueDate: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  lines: z.array(quoteLineItemSchema).optional(),
}).strict();

export type QuoteUpdate = z.infer<typeof quoteUpdateSchema>;

// Quote Response Schema
export const quoteResponseSchema = z.object({
  _id: z.string(),
  quoteNo: z.string(),
  clientId: z.string(),
  issueDate: z.date(),
  validUntil: z.date(),
  status: z.enum(['draft', 'issued', 'accepted', 'rejected', 'expired']),
  currency: z.string(),
  totals: quoteTotalsSchema,
  lines: z.array(quoteLineItemSchema),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type QuoteResponse = z.infer<typeof quoteResponseSchema>;