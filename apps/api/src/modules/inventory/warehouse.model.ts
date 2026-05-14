import { Schema, model, Document } from 'mongoose';

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

const warehouseSchema = new Schema<IWarehouse>(
    {
        code: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true },
        address: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            postalCode: { type: String, required: true },
            country: { type: String, required: true }
        },
        status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true }
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
    }
);

// Field-level indexes cover code/status

const Warehouse = model<IWarehouse>('Warehouse', warehouseSchema);

export default Warehouse;
