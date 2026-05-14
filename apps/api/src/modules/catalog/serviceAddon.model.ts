import { Schema, model, Document, Types } from 'mongoose';
import { ServiceAddon } from '@i-itsm/shared';

interface ServiceAddonDocument extends Omit<ServiceAddon, '_id'>, Omit<Document, '_id'> {
  _id: Types.ObjectId;
}

const serviceAddonSchema = new Schema<ServiceAddonDocument>(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    } as any,
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    priceCents: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'GBP',
      length: 3,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual', 'one_time'],
      required: true,
    },
    prorationEnabled: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'service_addons',
  }
);

// Create indexes
serviceAddonSchema.index({ serviceId: 1 });

export const ServiceAddonModel = model<ServiceAddonDocument>(
  'ServiceAddon',
  serviceAddonSchema
);

