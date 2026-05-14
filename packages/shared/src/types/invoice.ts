/**
 * Detailed invoice-related types
 */

import { Invoice, InvoiceLineItem, InvoiceTotals } from './billing';

/**
 * Invoice line item with all possible references
 */
export interface InvoiceLineItemDetailed extends InvoiceLineItem {
  // All possible entity references
  linkedEntities?: {
    product?: any;
    servicePlan?: any;
    serviceAddon?: any;
    subscription?: any;
    asset?: any;
    voipUsagePeriod?: any;
  };
}

/**
 * Invoice with expanded relationships
 */
export interface InvoiceDetailed extends Invoice {
  lines: InvoiceLineItemDetailed[];
  client?: any;
  order?: any;
}

/**
 * Invoice aggregation result
 */
export interface InvoiceAggregation {
  totalCount: number;
  statusBreakdown: {
    draft: number;
    issued: number;
    part_paid: number;
    paid: number;
    void: number;
  };
  financialSummary: {
    totalIssuedCents: number;
    totalPaidCents: number;
    totalOutstandingCents: number;
    totalOverdueCents: number;
  };
}

/**
 * Invoice creation payload
 */
export interface CreateInvoicePayload {
  clientId: string;
  orderId?: string;
  currency: string;
  dueDate: Date;
  lines: InvoiceLineItem[];
}

/**
 * Invoice state transition
 */
export interface InvoiceStateTransition {
  from: Invoice['status'];
  to: Invoice['status'];
  timestamp: Date;
  changedBy: string;
  reason?: string;
}

/**
 * Invoice audit trail
 */
export interface InvoiceAuditTrail {
  invoiceId: string;
  transitions: InvoiceStateTransition[];
  modifications: Array<{
    field: string;
    before: any;
    after: any;
    changedAt: Date;
    changedBy: string;
  }>;
}
