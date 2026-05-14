import { z } from 'zod';

// Addon item schema
const subscriptionAddonSchema = z.object({
  addonId: z.string().min(1, 'Addon ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPriceCents: z.number().int().nonnegative('Unit price cannot be negative'),
});

// Create subscription schema
export const createSubscriptionSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  clientSiteId: z.string().optional(),
  servicePlanId: z.string().min(1, 'Service plan ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPriceCents: z.number().int().nonnegative('Unit price cannot be negative').optional(),
  addonItems: z.array(subscriptionAddonSchema).optional(),
  startDate: z.string().datetime('Start date must be a valid ISO datetime'),
  notes: z.string().optional(),
  currency: z.string().length(3, 'Currency must be 3-letter code').optional().default('USD'),
});

// Update subscription schema
export const updateSubscriptionSchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive').optional(),
  unitPriceCents: z.number().int().nonnegative('Unit price cannot be negative').optional(),
  addonItems: z.array(subscriptionAddonSchema).optional(),
  notes: z.string().optional(),
});

// List subscriptions schema (query validation)
export const listSubscriptionsSchema = z.object({
  clientId: z.string().optional(),
  status: z.enum(['trial', 'active', 'paused', 'cancelled', 'expired']).optional(),
  limit: z.number().int().positive().optional(),
  skip: z.number().int().nonnegative().optional(),
});

// Subscription billing job schema
export const subscriptionBillingJobSchema = z.object({
  subscriptionId: z.string().optional(),
  period: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }).optional(),
});

// Subscription object schema (response)
export const subscriptionSchema = z.object({
  _id: z.string(),
  clientId: z.string(),
  clientSiteId: z.string().optional(),
  servicePlanId: z.string(),
  quantity: z.number().int().positive(),
  unitPriceCents: z.number().int().nonnegative(),
  currency: z.string(),
  status: z.enum(['trial', 'active', 'paused', 'cancelled', 'expired']),
  startDate: z.string().datetime(),
  nextInvoiceDate: z.string().datetime(),
  renewalDate: z.string().datetime(),
  cancelledAt: z.string().datetime().optional(),
  addonItems: z.array(subscriptionAddonSchema),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Subscription summary schema
export const subscriptionSummarySchema = z.object({
  activeSubscriptions: z.number().int().nonnegative(),
  totalMonthlyRecurringCents: z.number().int().nonnegative(),
  trialSubscriptions: z.number().int().nonnegative(),
  expiringSoonCount: z.number().int().nonnegative(),
  subscriptions: z.array(subscriptionSchema),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type ListSubscriptionsInput = z.infer<typeof listSubscriptionsSchema>;
export type SubscriptionBillingJob = z.infer<typeof subscriptionBillingJobSchema>;
export type Subscription = z.infer<typeof subscriptionSchema>;
export type SubscriptionSummary = z.infer<typeof subscriptionSummarySchema>;
