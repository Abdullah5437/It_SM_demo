import mongoose, { Schema, Document } from 'mongoose';

export interface OrderLineItem {
  lineNo: number;
  itemType: 'product' | 'service' | 'addon' | 'other';
  description: string;
  qty: number;
  unitPriceCents: number;
  taxRateBps: number;
  lineTotalCents: number;
  productId?: mongoose.Types.ObjectId;
  servicePlanId?: mongoose.Types.ObjectId;
  serviceAddonId?: mongoose.Types.ObjectId;
}

export interface IOrder extends Document {
  orderNo: string;
  quoteId?: mongoose.Types.ObjectId;
  orderDate: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  currency: string;
  clientName: string;
  clientEmail?: string;
  lines: OrderLineItem[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const orderLineItemSchema = new Schema<OrderLineItem>(
  {
    lineNo: { type: Number, required: true },
    itemType: {
      type: String,
      enum: ['product', 'service', 'addon', 'other'],
      required: true,
    },
    description: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    unitPriceCents: { type: Number, required: true, min: 0 },
    taxRateBps: { type: Number, required: true, min: 0 },
    lineTotalCents: { type: Number, required: true },
    productId: { type: Schema.Types.ObjectId, sparse: true },
    servicePlanId: { type: Schema.Types.ObjectId, sparse: true },
    serviceAddonId: { type: Schema.Types.ObjectId, sparse: true },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNo: { type: String, required: true, unique: true, index: true },
    quoteId: { type: Schema.Types.ObjectId, ref: 'Quote', sparse: true },
    orderDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
      index: true,
    },
    currency: { type: String, required: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String, sparse: true },
    lines: [orderLineItemSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
