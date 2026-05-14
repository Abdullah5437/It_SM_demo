export interface SubscriptionAddon {
  addonId: string;
  quantity: number;
  unitPriceCents: number;
}

export interface Subscription {
  _id: string;
  clientId: string;
  clientSiteId?: string;
  servicePlanId: string;
  quantity: number;
  unitPriceCents: number;
  currency: string;
  status: 'trial' | 'active' | 'paused' | 'cancelled' | 'expired';
  startDate: Date;
  nextInvoiceDate: Date;
  renewalDate: Date;
  cancelledAt?: Date;
  addonItems: SubscriptionAddon[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionInput {
  clientId: string;
  clientSiteId?: string;
  servicePlanId: string;
  quantity: number;
  unitPriceCents?: number;
  addonItems?: SubscriptionAddon[];
  startDate: Date;
  notes?: string;
  currency?: string;
}

export interface UpdateSubscriptionInput {
  quantity?: number;
  unitPriceCents?: number;
  addonItems?: SubscriptionAddon[];
  notes?: string;
}

export interface SubscriptionSummary {
  activeSubscriptions: number;
  totalMonthlyRecurringCents: number;
  trialSubscriptions: number;
  expiringSoonCount: number;
  subscriptions: Subscription[];
}

export interface InvoiceLine {
  itemType: 'subscription' | 'addon';
  itemId: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  taxBasisPoints?: number;
}

export interface InvoiceCalculation {
  lines: InvoiceLine[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
}
