import mongoose, { Schema, Document } from 'mongoose';

export interface QuoteLineItem {
  lineNo: number;
  itemType: 'product' | 'service' | 'addon' | 'other';
  description: string;
  qty: number;
  unitPriceCents: number;
  taxRateBps: number; // basis points
  lineTotalCents: number;
  productId?: mongoose.Types.ObjectId;
  servicePlanId?: mongoose.Types.ObjectId;
  serviceAddonId?: mongoose.Types.ObjectId;
}

export interface QuoteTotals {
  subTotalCents: number;
  taxCents: number;
  totalCents: number;
}

export interface IQuote extends Document {
  quoteNo: string;
  clientId: mongoose.Types.ObjectId;
  issueDate: Date;
  validUntil: Date;
  status: 'draft' | 'issued' | 'accepted' | 'rejected' | 'expired';
  currency: string;
  totals: QuoteTotals;
  lines: QuoteLineItem[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const quoteLineItemSchema = new Schema<QuoteLineItem>(
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
  },
  { _id: false }
);

const quoteTotalsSchema = new Schema<QuoteTotals>(
  {
    subTotalCents: { type: Number, required: true, min: 0 },
    taxCents: { type: Number, required: true, min: 0 },
    totalCents: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const quoteSchema = new Schema<IQuote>(
  {
    quoteNo: { type: String, required: true, unique: true, index: true },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    issueDate: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    status: {
      type: String,
      enum: ['draft', 'issued', 'accepted', 'rejected', 'expired'],
      default: 'draft',
      index: true,
    },
    currency: { type: String, required: true },
    totals: { type: quoteTotalsSchema, required: true },
    lines: [quoteLineItemSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now, index: { expires: 7776000 } }, // 90 days
  },
  { timestamps: true }
);

export const Quote = mongoose.model<IQuote>('Quote', quoteSchema);
