import mongoose, { Schema, Document } from 'mongoose';

export interface InvoiceLineItem {
  lineNo: number;
  itemType: 'product' | 'service' | 'addon' | 'other';
  description: string;
  qty: number;
  unitPriceCents: number;
  taxRateBps: number;
  lineTotalCents: number;
  productId?: mongoose.Types.ObjectId;
  servicePlanId?: mongoose.Types.ObjectId;
  serviceAddonId?: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId;
  assetId?: mongoose.Types.ObjectId;
  voipUsagePeriodId?: mongoose.Types.ObjectId;
}

export interface InvoiceTotals {
  subTotalCents: number;
  taxCents: number;
  totalCents: number;
}

export interface InvoicePDF {
  storageKey: string;
  generatedAt: Date;
}

export interface IInvoice extends Document {
  invoiceNo: string;
  clientId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  status: 'draft' | 'issued' | 'part_paid' | 'paid' | 'void';
  issueDate: Date;
  dueDate: Date;
  currency: string;
  totals: InvoiceTotals;
  balanceCents: number;
  lines: InvoiceLineItem[];
  pdf?: InvoicePDF;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceLineItemSchema = new Schema<InvoiceLineItem>(
  {
    lineNo: { type: Number, required: true },
    itemType: {
      type: String,
      enum: ['product', 'service', 'addon', 'other'],
      required: true,
    },
    description: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    unitPriceCents: { type: Number, required: true, min: 0 },
    taxRateBps: { type: Number, required: true, min: 0 },
    lineTotalCents: { type: Number, required: true },
    productId: { type: Schema.Types.ObjectId, sparse: true },
    servicePlanId: { type: Schema.Types.ObjectId, sparse: true },
    serviceAddonId: { type: Schema.Types.ObjectId, sparse: true },
    subscriptionId: { type: Schema.Types.ObjectId, sparse: true },
    assetId: { type: Schema.Types.ObjectId, sparse: true },
    voipUsagePeriodId: { type: Schema.Types.ObjectId, sparse: true },
  },
  { _id: false }
);

const invoiceTotalsSchema = new Schema<InvoiceTotals>(
  {
    subTotalCents: { type: Number, required: true, min: 0 },
    taxCents: { type: Number, required: true, min: 0 },
    totalCents: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoicePDFSchema = new Schema<InvoicePDF>(
  {
    storageKey: { type: String, required: true },
    generatedAt: { type: Date, required: true },
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNo: { type: String, required: true, unique: true, index: true },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', sparse: true },
    status: {
      type: String,
      enum: ['draft', 'issued', 'part_paid', 'paid', 'void'],
      default: 'draft',
      index: true,
    },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true, index: true },
    currency: { type: String, required: true },
    totals: { type: invoiceTotalsSchema, required: true },
    balanceCents: { type: Number, required: true, min: 0 },
    lines: [invoiceLineItemSchema],
    pdf: { type: invoicePDFSchema, sparse: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent editing lines after invoice is issued
invoiceSchema.pre('save', function (next) {
  if (this.isModified('lines') && this.status !== 'draft') {
    next(new Error('Cannot modify invoice lines after issue'));
  }
  next();
});

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
