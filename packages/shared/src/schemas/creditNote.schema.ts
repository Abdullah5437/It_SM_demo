import { z } from 'zod';

// Credit Note Create Schema
export const creditNoteCreateSchema = z.object({
  clientId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  invoiceId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  amountCents: z.number().positive(),
  reason: z.enum(['overpayment', 'return', 'discount', 'other']),
  currency: z.string().length(3).toUpperCase(),
});

export type CreditNoteCreate = z.infer<typeof creditNoteCreateSchema>;

// Credit Note Apply Schema
export const creditNoteApplySchema = z.object({
  targetInvoiceId: z.string().regex(/^[0-9a-fA-F]{24}$/),
});

export type CreditNoteApply = z.infer<typeof creditNoteApplySchema>;

// Credit Note Response Schema
export const creditNoteResponseSchema = z.object({
  _id: z.string(),
  creditNo: z.string(),
  clientId: z.string(),
  invoiceId: z.string(),
  issueDate: z.date(),
  amountCents: z.number().positive(),
  currency: z.string(),
  reason: z.enum(['overpayment', 'return', 'discount', 'other']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreditNoteResponse = z.infer<typeof creditNoteResponseSchema>;
