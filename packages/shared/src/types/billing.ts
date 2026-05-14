/**
 * Billing domain types
 */

export interface Quote {
  _id?: string;
  quoteNo: string;
  clientId: string;
  issueDate: Date;
  validUntil: Date;
  status: 'draft' | 'issued' | 'accepted' | 'rejected' | 'expired';
  currency: string;
  totals: QuoteTotals;
  lines: QuoteLineItem[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteLineItem {
  lineNo: number;
  itemType: 'product' | 'service' | 'addon' | 'other';
  description: string;
  qty: number;
  unitPriceCents: number;
  taxRateBps: number;
  lineTotalCents: number;
  productId?: string;
  servicePlanId?: string;
  serviceAddonId?: string;
}

export interface QuoteTotals {
  subTotalCents: number;
  taxCents: number;
  totalCents: number;
}

export interface Order {
  _id?: string;
  orderNo: string;
  clientId: string;
  quoteId?: string;
  orderDate: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  currency: string;
  lines: OrderLineItem[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderLineItem extends QuoteLineItem {}

export interface Invoice {
  _id?: string;
  invoiceNo: string;
  clientId: string;
  orderId?: string;
  status: 'draft' | 'issued' | 'part_paid' | 'paid' | 'void';
  issueDate: Date;
  dueDate: Date;
  currency: string;
  totals: InvoiceTotals;
  balanceCents: number;
  lines: InvoiceLineItem[];
  pdf?: InvoicePDF;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItem extends QuoteLineItem {
  subscriptionId?: string;
  assetId?: string;
  voipUsagePeriodId?: string;
}

export interface InvoiceTotals extends QuoteTotals {}

export interface InvoicePDF {
  storageKey: string;
  generatedAt: Date;
}

export interface Payment {
  _id?: string;
  clientId: string;
  paymentDate: Date;
  method: 'card' | 'bank_transfer' | 'check' | 'cash' | 'credit';
  reference: string;
  amountCents: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentAllocation {
  _id?: string;
  paymentId: string;
  invoiceId: string;
  amountCents: number;
  createdAt: Date;
}

export interface CreditNote {
  _id?: string;
  creditNo: string;
  clientId: string;
  invoiceId: string;
  issueDate: Date;
  amountCents: number;
  currency: string;
  reason: 'overpayment' | 'return' | 'discount' | 'other';
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingSummary {
  clientId: string;
  totalInvoicesCents: number;
  openInvoiceBalanceCents: number;
  overdueBalanceCents: number;
  paidInvoicesCents: number;
  creditBalanceCents: number;
  invoicesByStatus: {
    draft: number;
    issued: number;
    part_paid: number;
    paid: number;
    void: number;
  };
  recentInvoices: Invoice[];
  recentPayments: Payment[];
}
