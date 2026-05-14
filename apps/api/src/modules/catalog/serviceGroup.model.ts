import { Schema, model, Document, Types } from 'mongoose';
import { ServiceGroup } from '@i-itsm/shared';

interface ServiceGroupDocument extends Omit<ServiceGroup, '_id'>, Omit<Document, '_id'> {
  _id: Types.ObjectId;
}

const serviceGroupSchema = new Schema<ServiceGroupDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 255,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'service_groups',
  }
);

// Index is handled by unique constraint on name

export const ServiceGroupModel = model<ServiceGroupDocument>(
  'ServiceGroup',
  serviceGroupSchema
);

