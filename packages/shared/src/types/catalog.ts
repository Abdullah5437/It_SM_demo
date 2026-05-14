/**
 * Service Catalog Types
 * Represents service catalog entities (groups, services, plans, addons)
 */

export type ServiceType = 'one_off' | 'subscription' | 'usage' | 'project';
export type ServiceStatus = 'active' | 'inactive' | 'deprecated';
export type BillingModel = 'flat_fee' | 'per_unit' | 'tiered';
export type BillingCycle = 'monthly' | 'quarterly' | 'annual' | 'one_time';

export interface ServiceGroup {
  _id?: string;
  name: string; // Unique
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Service {
  _id?: string;
  serviceGroupId: string;
  name: string;
  type: ServiceType;
  status: ServiceStatus;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServicePlan {
  _id?: string;
  serviceId: string;
  name: string;
  billingModel: BillingModel;
  billingCycle: BillingCycle;
  basePriceCents: number;
  currency: string; // ISO 4217 code
  prorationEnabled: boolean;
  defaultQty?: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServiceAddon {
  _id?: string;
  serviceId: string;
  name: string;
  priceCents: number;
  currency: string; // ISO 4217 code
  billingCycle: BillingCycle;
  prorationEnabled: boolean;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
