import { Schema, model, Document } from 'mongoose';

export interface IProductVariant {
  name: string;
  sku?: string;
  stock: number;
  salePrice?: number;
  costPrice?: number;
}

const variantSchema = new Schema(
  {
    name: { type: String, required: true },
    sku: { type: String },
    stock: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 },
    costPrice: { type: Number, default: 0 },
  },
  { _id: false }
);

export interface IProduct extends Document {
  sku: string;
  name: string;
  title?: string;
  description?: string;
  image?: string;

  type: 'hardware' | 'software' | 'component' | 'other';

  category?: string;
  subcategory?: string;
  subsubcategory?: string;
  categoryId?: Schema.Types.ObjectId;

  defaultSalePrice: number;
  defaultCost: number;
  currency: string;

  trackInventory: boolean;
  trackSerial: boolean;

  stock: number;
  variants: IProductVariant[];

  status: 'active' | 'inactive' | 'discontinued';

  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  sku: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  title: { type: String },
  description: { type: String },
  image: { type: String },

  type: {
    type: String,
    enum: ['hardware', 'software', 'component', 'other'],
    required: true,
    index: true,
  },

  category: { type: String },
  subcategory: { type: String },
  subsubcategory: { type: String },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },

  defaultSalePrice: { type: Number, required: true },
  defaultCost: { type: Number, required: true },
  currency: { type: String, required: true, default: 'USD' },

  trackInventory: { type: Boolean, default: true },
  trackSerial: { type: Boolean, default: false },

  stock: { type: Number, default: 0 },

  variants: { type: [variantSchema], default: [] },

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