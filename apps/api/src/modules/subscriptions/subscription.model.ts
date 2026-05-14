import mongoose, { Document, Schema } from 'mongoose';

export interface SubscriptionAddon {
  addonId: mongoose.Types.ObjectId;
  quantity: number;
  unitPriceCents: number;
}

export interface SubscriptionDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  clientSiteId?: mongoose.Types.ObjectId;
  servicePlanId: mongoose.Types.ObjectId;
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

const subscriptionAddonSchema = new Schema<SubscriptionAddon>(
  {
    addonId: { type: Schema.Types.ObjectId, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPriceCents: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const subscriptionSchema = new Schema<SubscriptionDocument>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Client',
      index: true,
    },
    clientSiteId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientSite',
    },
    servicePlanId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'ServicePlan',
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPriceCents: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['trial', 'active', 'paused', 'cancelled', 'expired'],
      default: 'active',
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      immutable: true,
    },
    nextInvoiceDate: {
      type: Date,
      required: true,
    },
    renewalDate: {
      type: Date,
      required: true,
    },
    cancelledAt: {
      type: Date,
    },
    addonItems: {
      type: [subscriptionAddonSchema],
      default: [],
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Compound index for efficient queries
subscriptionSchema.index({ clientId: 1, status: 1 });
subscriptionSchema.index({ nextInvoiceDate: 1 });
subscriptionSchema.index({ servicePlanId: 1 });

const Subscription = mongoose.model<SubscriptionDocument>(
  'Subscription',
  subscriptionSchema,
  'subscriptions'
);

export default Subscription;
