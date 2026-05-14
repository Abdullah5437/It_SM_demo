import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  key: string;
  value: string;
  group: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const settingSchema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: String, required: true },
    group: { type: String, required: true, default: 'general', index: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Setting = mongoose.model<ISetting>('Setting', settingSchema);