import { Schema, model, Document, Types } from 'mongoose';
import { Service } from '@i-itsm/shared';

interface ServiceDocument extends Omit<Service, '_id'>, Omit<Document, '_id'> {
  _id: Types.ObjectId;
}

const serviceSchema = new Schema<ServiceDocument>(
  {
    serviceGroupId: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceGroup',
      required: true,
    } as any,
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    type: {
      type: String,
      enum: ['one_off', 'subscription', 'usage', 'project'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'deprecated'],
      default: 'active',
    },
    description: {
      type: String,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'services',
  }
);

// Create indexes
serviceSchema.index({ serviceGroupId: 1 });
serviceSchema.index({ status: 1 });
serviceSchema.index({ type: 1 });

export const ServiceModel = model<ServiceDocument>('Service', serviceSchema);

