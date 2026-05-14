import { z } from 'zod';

/**
 * Catalog Validation Schemas
 */

export const ServiceTypeSchema = z.enum(['one_off', 'subscription', 'usage', 'project']);
export const ServiceStatusSchema = z.enum(['active', 'inactive', 'deprecated']);
export const BillingModelSchema = z.enum(['flat_fee', 'per_unit', 'tiered']);
export const BillingCycleSchema = z.enum(['monthly', 'quarterly', 'annual', 'one_time']);

// Service Group schemas
export const ServiceGroupCreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
});

export const ServiceGroupUpdateSchema = ServiceGroupCreateSchema.partial();

export const ServiceGroupSchema = ServiceGroupCreateSchema.extend({
  _id: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Service schemas
export const ServiceCreateSchema = z.object({
  serviceGroupId: z.string(),
  name: z.string().min(1).max(255),
  type: ServiceTypeSchema,
  status: ServiceStatusSchema.default('active'),
  description: z.string().max(2000).optional(),
});

export const ServiceUpdateSchema = ServiceCreateSchema.partial();

export const ServiceSchema = ServiceCreateSchema.extend({
  _id: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Service Plan schemas
export const ServicePlanCreateSchema = z.object({
  serviceId: z.string(),
  name: z.string().min(1).max(255),
  billingModel: BillingModelSchema,
  billingCycle: BillingCycleSchema,
  basePriceCents: z.number().int().nonnegative(),
  currency: z.string().length(3), // ISO 4217
  prorationEnabled: z.boolean().default(true),
  defaultQty: z.number().int().positive().optional(),
  description: z.string().max(2000).optional(),
});

export const ServicePlanUpdateSchema = ServicePlanCreateSchema.partial();

export const ServicePlanSchema = ServicePlanCreateSchema.extend({
  _id: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Service Addon schemas
export const ServiceAddonCreateSchema = z.object({
  serviceId: z.string(),
  name: z.string().min(1).max(255),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().length(3), // ISO 4217
  billingCycle: BillingCycleSchema,
  prorationEnabled: z.boolean().default(true),
  description: z.string().max(2000).optional(),
});

export const ServiceAddonUpdateSchema = ServiceAddonCreateSchema.partial();

export const ServiceAddonSchema = ServiceAddonCreateSchema.extend({
  _id: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Export all catalog schemas
export const CatalogSchemas = {
  ServiceTypeSchema,
  ServiceStatusSchema,
  BillingModelSchema,
  BillingCycleSchema,
  ServiceGroupCreateSchema,
  ServiceGroupUpdateSchema,
  ServiceGroupSchema,
  ServiceCreateSchema,
  ServiceUpdateSchema,
  ServiceSchema,
  ServicePlanCreateSchema,
  ServicePlanUpdateSchema,
  ServicePlanSchema,
  ServiceAddonCreateSchema,
  ServiceAddonUpdateSchema,
  ServiceAddonSchema,
};

export type ServiceGroupCreateInput = z.infer<typeof ServiceGroupCreateSchema>;
export type ServiceGroupUpdateInput = z.infer<typeof ServiceGroupUpdateSchema>;
export type ServiceCreateInput = z.infer<typeof ServiceCreateSchema>;
export type ServiceUpdateInput = z.infer<typeof ServiceUpdateSchema>;
export type ServicePlanCreateInput = z.infer<typeof ServicePlanCreateSchema>;
export type ServicePlanUpdateInput = z.infer<typeof ServicePlanUpdateSchema>;
export type ServiceAddonCreateInput = z.infer<typeof ServiceAddonCreateSchema>;
export type ServiceAddonUpdateInput = z.infer<typeof ServiceAddonUpdateSchema>;
