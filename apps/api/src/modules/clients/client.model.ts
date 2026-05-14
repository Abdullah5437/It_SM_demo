import { Schema, model, Document, Types } from 'mongoose';
import { Client } from '@i-itsm/shared';

interface ClientDocument extends Omit<Client, '_id'>, Omit<Document, '_id'> {
  _id: Types.ObjectId;
}

const clientSchema = new Schema<ClientDocument>(
  {
    clientCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50,
    },
    legalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    tradingName: {
      type: String,
      trim: true,
      maxlength: 255,
    },
    vatNo: {
      type: String,
      maxlength: 50,
    },
    companyRegNo: {
      type: String,
      maxlength: 50,
    },
    paymentTermsDays: {
      type: Number,
      min: 0,
    },
    creditLimitCents: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'GBP',
      length: 3,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    gdprMarketingConsent: {
      type: Boolean,
      default: false,
    },
    denormalizedCounters: {
      openInvoiceBalanceCents: {
        type: Number,
        default: 0,
        min: 0,
      },
      overdueBalanceCents: {
        type: Number,
        default: 0,
        min: 0,
      },
      activeSubscriptionsCount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'clients',
  }
);

// Create indexes (avoid duplicating unique field indexes)
clientSchema.index({ status: 1 });
clientSchema.index({ createdAt: -1 });

export const ClientModel = model<ClientDocument>('Client', clientSchema);

