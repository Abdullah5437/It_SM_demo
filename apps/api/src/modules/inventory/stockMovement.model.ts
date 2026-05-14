import { Schema, model, Document } from 'mongoose';

export interface IStockMovement extends Document {
    productId: Schema.Types.ObjectId;
    warehouseId: Schema.Types.ObjectId;
    qtyDelta: number;
    reason: 'purchase' | 'sale' | 'return' | 'adjustment' | 'damage' | 'other';
    ref?: {
        type: string;
        id: Schema.Types.Mixed;
    };
    createdBy?: string;
    createdAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    qtyDelta: { type: Number, required: true },
    reason: { type: String, enum: ['purchase', 'sale', 'return', 'adjustment', 'damage', 'other'], required: true, index: true },
    ref: {
        type: { type: String },
        id: { type: Schema.Types.Mixed }
    },
    createdBy: String,
    createdAt: { type: Date, default: Date.now, immutable: true }
});

// Indexes
stockMovementSchema.index({ productId: 1, warehouseId: 1, createdAt: -1 });

const StockMovement = model<IStockMovement>('StockMovement', stockMovementSchema);

export default StockMovement;
