import { Schema, model, Document, Types } from 'mongoose';
import { ServicePlan } from '@i-itsm/shared';

interface ServicePlanDocument extends Omit<ServicePlan, '_id'>, Omit<Document, '_id'> {
  _id: Types.ObjectId;
}

const servicePlanSchema = new Schema<ServicePlanDocument>(
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
    billingModel: {
      type: String,
      enum: ['flat_fee', 'per_unit', 'tiered'],
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual', 'one_time'],
      required: true,
    },
    basePriceCents: {
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
    prorationEnabled: {
      type: Boolean,
      default: true,
    },
    defaultQty: {
      type: Number,
      min: 1,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'service_plans',
  }
);

// Create indexes
servicePlanSchema.index({ serviceId: 1 });

export const ServicePlanModel = model<ServicePlanDocument>(
  'ServicePlan',
  servicePlanSchema
);

