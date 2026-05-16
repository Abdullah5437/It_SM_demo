import { Schema, model, Document } from 'mongoose';

export interface IProductSize {
  name: string;
  stock: number;
  salePrice?: number;
  costPrice?: number;
}

const sizeSchema = new Schema(
  {
    name: { type: String, required: true },
    stock: { type: Number, default: 0 },
    salePrice: { type: Number },
    costPrice: { type: Number },
  },
  { _id: false }
);

export interface IProduct extends Document {
  sku: string;
  name: string;
  title?: string;
  description?: string;

  type: 'Mens' | 'Women' | 'Children' | 'Other';

  defaultSalePrice: number;
  defaultCost: number;
  currency: string;

  trackInventory: boolean;
  trackSerial: boolean;

  stock: number;
  sizes: IProductSize[];

  status: 'active' | 'inactive' | 'discontinued';

  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  sku: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  title: { type: String },
  description: { type: String },

  type: {
    type: String,
    enum: ['Mens', 'Women', 'Children', 'Other'],
    required: true,
    index: true,
  },

  defaultSalePrice: { type: Number, required: true },
  defaultCost: { type: Number, required: true },
  currency: { type: String, required: true, default: 'PKR' },

  trackInventory: { type: Boolean, default: true },
  trackSerial: { type: Boolean, default: false },

  stock: { type: Number, default: 0 },

  sizes: { type: [sizeSchema], default: [] },

  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active',
    index: true,
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Product = model<IProduct>('Product', productSchema);

export default Product;