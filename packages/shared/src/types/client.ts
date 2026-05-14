/**
 * Client Types
 * Represents customer/client entities in the system
 */

export type ClientStatus = 'active' | 'inactive' | 'suspended';

export interface DenormalizedCounters {
  openInvoiceBalanceCents: number;
  overdueBalanceCents: number;
  activeSubscriptionsCount: number;
}

export interface Client {
  _id?: string;
  clientCode: string; // Unique identifier
  legalName: string;
  tradingName?: string;
  vatNo?: string;
  companyRegNo?: string;
  paymentTermsDays?: number;
  creditLimitCents?: number;
  currency: string; // ISO 4217 code (e.g., GBP, USD)
  status: ClientStatus;
  gdprMarketingConsent?: boolean;
  denormalizedCounters: DenormalizedCounters;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ClientContact {
  _id?: string;
  clientId: string;
  name: string;
  email: string;
  phone?: string;
  role: 'primary' | 'billing' | 'technical' | 'other';
  isPrimary: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ClientSite {
  _id?: string;
  clientId: string;
  name: string;
  address: {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ClientHoldings {
  client: Client;
  assets: unknown[]; // Placeholder for inventory
  subscriptions: unknown[]; // Placeholder for active subscriptions
  voip: Array<{
    instance: unknown; // VoIP instance
    latestUsagePeriod: unknown; // Latest usage
  }>;
  supportContracts: unknown[]; // Placeholder for support
  totals: {
    openBalanceCents: number;
    overdueBalanceCents: number;
    activeSubscriptionsCount: number;
  };
}
