import { z } from 'zod';
import { quoteLineItemSchema, quoteTotalsSchema } from './quote.schema';

// Invoice Line Item Schema (extended from quote)
export const invoiceLineItemSchema = quoteLineItemSchema.extend({
  subscriptionId: z.string().optional(),
  assetId: z.string().optional(),
  voipUsagePeriodId: z.string().optional(),
});

export type InvoiceLineItem = z.infer<typeof invoiceLineItemSchema>;

// Invoice Totals Schema
export const invoiceTotalsSchema = quoteTotalsSchema;
export type InvoiceTotals = z.infer<typeof invoiceTotalsSchema>;

// Invoice PDF Schema
export const invoicePDFSchema = z.object({
  storageKey: z.string(),
  generatedAt: z.date(),
});

export type InvoicePDF = z.infer<typeof invoicePDFSchema>;

// Invoice Create Schema
export const invoiceCreateSchema = z.object({
  clientId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  lines: z.array(invoiceLineItemSchema).min(1),
  dueDate: z.string().datetime(),
  currency: z.string().length(3).toUpperCase(),
  orderId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

export type InvoiceCreate = z.infer<typeof invoiceCreateSchema>;

// Invoice Update Schema
export const invoiceUpdateSchema = z.object({
  dueDate: z.string().datetime().optional(),
  lines: z.array(invoiceLineItemSchema).optional(),
}).strict();

export type InvoiceUpdate = z.infer<typeof invoiceUpdateSchema>;

// Invoice Response Schema
export const invoiceResponseSchema = z.object({
  _id: z.string(),
  invoiceNo: z.string(),
  clientId: z.string(),
  orderId: z.string().optional(),
  status: z.enum(['draft', 'issued', 'part_paid', 'paid', 'void']),
  issueDate: z.date(),
  dueDate: z.date(),
  currency: z.string(),
  totals: invoiceTotalsSchema,
  balanceCents: z.number().nonnegative(),
  lines: z.array(invoiceLineItemSchema),
  pdf: invoicePDFSchema.optional(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type InvoiceResponse = z.infer<typeof invoiceResponseSchema>;
