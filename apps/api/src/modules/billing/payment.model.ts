import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  clientId: mongoose.Types.ObjectId;
  paymentDate: Date;
  method: 'card' | 'bank_transfer' | 'check' | 'cash' | 'credit';
  reference: string;
  amountCents: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    paymentDate: { type: Date, required: true },
    method: {
      type: String,
      enum: ['card', 'bank_transfer', 'check', 'cash', 'credit'],
      required: true,
    },
    reference: { type: String, required: true },
    amountCents: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed', 'cancelled'],
      default: 'pending',
    },
    createdAt: { type: Date, default: Date.now, index: { expires: 2592000 } }, // 30 days
  },
  { timestamps: true }
);

// Compound index for common queries
paymentSchema.index({ clientId: 1, paymentDate: -1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
