import { z } from 'zod';

/**
 * Client Validation Schemas
 */

export const DenormalizedCountersSchema = z.object({
  openInvoiceBalanceCents: z.number().nonnegative(),
  overdueBalanceCents: z.number().nonnegative(),
  activeSubscriptionsCount: z.number().nonnegative(),
});

export const ClientStatusSchema = z.enum(['active', 'inactive', 'suspended']);

export const ClientCreateSchema = z.object({
  clientCode: z.string().min(1).max(50),
  legalName: z.string().min(1).max(255),
  tradingName: z.string().max(255).optional(),
  vatNo: z.string().max(50).optional(),
  companyRegNo: z.string().max(50).optional(),
  paymentTermsDays: z.number().int().nonnegative().optional(),
  creditLimitCents: z.number().int().nonnegative().optional(),
  currency: z.string().length(3), // ISO 4217
  status: ClientStatusSchema.default('active'),
  gdprMarketingConsent: z.boolean().default(false),
});

export const ClientUpdateSchema = ClientCreateSchema.partial();

export const ClientSchema = ClientCreateSchema.extend({
  _id: z.string().optional(),
  denormalizedCounters: DenormalizedCountersSchema,
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Contact types
export const ClientContactRoleSchema = z.enum(['primary', 'billing', 'technical', 'other']);

export const ClientContactCreateSchema = z.object({
  clientId: z.string(),
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  role: ClientContactRoleSchema,
  isPrimary: z.boolean().default(false),
});

export const ClientContactUpdateSchema = ClientContactCreateSchema.omit({ clientId: true }).partial();

export const ClientContactSchema = ClientContactCreateSchema.extend({
  _id: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Site schemas
export const ClientSiteAddressSchema = z.object({
  street: z.string().min(1).max(255),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2), // ISO 3166-1 alpha-2
});

export const ClientSiteCreateSchema = z.object({
  clientId: z.string(),
  name: z.string().min(1).max(255),
  address: ClientSiteAddressSchema,
});

export const ClientSiteUpdateSchema = ClientSiteCreateSchema.omit({ clientId: true }).partial();

export const ClientSiteSchema = ClientSiteCreateSchema.extend({
  _id: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Export all client schemas
export const ClientSchemas = {
  DenormalizedCountersSchema,
  ClientStatusSchema,
  ClientCreateSchema,
  ClientUpdateSchema,
  ClientSchema,
  ClientContactRoleSchema,
  ClientContactCreateSchema,
  ClientContactUpdateSchema,
  ClientContactSchema,
  ClientSiteAddressSchema,
  ClientSiteCreateSchema,
  ClientSiteUpdateSchema,
  ClientSiteSchema,
};

export type ClientCreateInput = z.infer<typeof ClientCreateSchema>;
export type ClientUpdateInput = z.infer<typeof ClientUpdateSchema>;
export type ClientContactCreateInput = z.infer<typeof ClientContactCreateSchema>;
export type ClientContactUpdateInput = z.infer<typeof ClientContactUpdateSchema>;
export type ClientSiteCreateInput = z.infer<typeof ClientSiteCreateSchema>;
export type ClientSiteUpdateInput = z.infer<typeof ClientSiteUpdateSchema>;
