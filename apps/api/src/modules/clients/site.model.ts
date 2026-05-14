import { Schema, model, Document, Types } from 'mongoose';
import { ClientSite } from '@i-itsm/shared';

interface ClientSiteDocument extends Omit<ClientSite, '_id'>, Omit<Document, '_id'> {
  _id: Types.ObjectId;
}

const siteSchema = new Schema<ClientSiteDocument>(
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
    address: {
      street: {
        type: String,
        required: true,
        maxlength: 255,
      },
      city: {
        type: String,
        required: true,
        maxlength: 100,
      },
      state: {
        type: String,
        maxlength: 100,
      },
      postalCode: {
        type: String,
        required: true,
        maxlength: 20,
      },
      country: {
        type: String,
        required: true,
        length: 2, // ISO 3166-1 alpha-2
      },
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'client_sites',
  }
);

// Create indexes
siteSchema.index({ clientId: 1 });

export const ClientSiteModel = model<ClientSiteDocument>('ClientSite', siteSchema);

