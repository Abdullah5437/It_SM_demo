import { Schema, model, Document } from 'mongoose';

export interface ISubSubcategory {
  name: string;
  description?: string;
}

const subSubcategorySchema = new Schema<ISubSubcategory>(
  {
    name: { type: String, required: true },
    description: { type: String },
  },
  { _id: false }
);

export interface ISubcategory {
  name: string;
  description?: string;
  subSubcategories: ISubSubcategory[];
}

const subcategorySchema = new Schema<ISubcategory>(
  {
    name: { type: String, required: true },
    description: { type: String },
    subSubcategories: { type: [subSubcategorySchema], default: [] },
  },
  { _id: false }
);

export interface ICategory extends Document {
  name: string;
  description?: string;
  type?: 'hardware' | 'software' | 'component' | 'other';
  subcategories: ISubcategory[];
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true, index: true },
  description: { type: String },
  type: {
    type: String,
    enum: ['hardware', 'software', 'component', 'other'],
    index: true,
  },
  subcategories: { type: [subcategorySchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Category = model<ICategory>('Category', categorySchema);

export default Category;