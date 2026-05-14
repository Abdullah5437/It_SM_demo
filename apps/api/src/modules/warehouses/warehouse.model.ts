import mongoose, { Document, Schema } from 'mongoose';

export interface IWarehouse extends Document {
    code: string;
    name: string;
    address: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}

const WarehouseSchema: Schema = new Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    status: { type: String, enum: ['active', 'inactive'], required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Warehouse = mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);
export default Warehouse;