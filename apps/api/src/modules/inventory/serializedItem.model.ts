import { Schema, model, Document } from 'mongoose';

export interface ISerializedItem extends Document {
    serialNo: string;
    productId: Schema.Types.ObjectId;
    status: 'in_stock' | 'sold' | 'returned' | 'scrapped' | 'assigned';
    warehouseId?: Schema.Types.ObjectId | null;
    createdAt: Date;
}

const serializedItemSchema = new Schema<ISerializedItem>({
    serialNo: { type: String, required: true, unique: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    status: { type: String, enum: ['in_stock', 'sold', 'returned', 'scrapped', 'assigned'], default: 'in_stock', index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', sparse: true },
    createdAt: { type: Date, default: Date.now, immutable: true }
});

// Composite index
serializedItemSchema.index({ productId: 1, status: 1 });

const SerializedItem = model<ISerializedItem>('SerializedItem', serializedItemSchema);

export default SerializedItem;
