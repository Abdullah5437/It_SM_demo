import { Schema, model, Document, Types } from 'mongoose';
import { ClientContact } from '@i-itsm/shared';

interface ClientContactDocument extends Omit<ClientContact, '_id'>, Omit<Document, '_id'> {
  _id: Types.ObjectId;
}

const contactSchema = new Schema<ClientContactDocument>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    } as any,
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /.+\@.+\..+/,
    },
    phone: {
      type: String,
      maxlength: 20,
    },
    role: {
      type: String,
      enum: ['primary', 'billing', 'technical', 'other'],
      default: 'other',
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'client_contacts',
  }
);

// Create indexes
contactSchema.index({ clientId: 1, isPrimary: 1 });

export const ClientContactModel = model<ClientContactDocument>(
  'ClientContact',
  contactSchema
);

