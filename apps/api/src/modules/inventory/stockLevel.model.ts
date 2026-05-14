import { Schema, model, Document } from 'mongoose';

export interface IStockLevel extends Document {
    productId: Schema.Types.ObjectId;
    warehouseId: Schema.Types.ObjectId;
    qtyOnHand: number;
    qtyReserved: number;
    reorderPoint: number;
    reorderQty: number;
    updatedAt: Date;
}

const stockLevelSchema = new Schema<IStockLevel>({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    qtyOnHand: { type: Number, required: true, default: 0, min: 0 },
    qtyReserved: { type: Number, required: true, default: 0, min: 0 },
    reorderPoint: { type: Number, required: true, default: 0 },
    reorderQty: { type: Number, required: true, default: 0 },
    updatedAt: { type: Date, default: Date.now }
});

// Unique index on productId + warehouseId
stockLevelSchema.index({ productId: 1, warehouseId: 1 }, { unique: true });
stockLevelSchema.index({ qtyOnHand: 1 });

const StockLevel = model<IStockLevel>('StockLevel', stockLevelSchema);

export default StockLevel;
