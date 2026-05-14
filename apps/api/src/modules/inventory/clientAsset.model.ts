import { Schema, model, Document } from 'mongoose';

export interface IClientAsset extends Document {
    clientId: Schema.Types.ObjectId;
    clientSiteId?: Schema.Types.ObjectId;
    productId: Schema.Types.ObjectId;
    serializedItemId?: Schema.Types.ObjectId;
    assetTag: string;
    status: 'active' | 'replaced' | 'returned' | 'retired';
    warrantyStart: Date;
    warrantyEnd: Date;
    purchase?: {
        invoiceId?: Schema.Types.Mixed;
        invoiceLineId?: Schema.Types.Mixed;
    };
    createdBy?: string;
    createdAt: Date;
}

const clientAssetSchema = new Schema<IClientAsset>({
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    clientSiteId: { type: Schema.Types.ObjectId, ref: 'ClientSite' },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    serializedItemId: { type: Schema.Types.ObjectId, ref: 'SerializedItem' },
    assetTag: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ['active', 'replaced', 'returned', 'retired'], default: 'active', index: true },
    warrantyStart: { type: Date, required: true },
    warrantyEnd: { type: Date, required: true, index: true },
    purchase: {
        invoiceId: { type: Schema.Types.Mixed },
        invoiceLineId: { type: Schema.Types.Mixed }
    },
    createdBy: String,
    createdAt: { type: Date, default: Date.now }
});

// Composite indexes
clientAssetSchema.index({ clientId: 1, status: 1 });

const ClientAsset = model<IClientAsset>('ClientAsset', clientAssetSchema);

export default ClientAsset;
