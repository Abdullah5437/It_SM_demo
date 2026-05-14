import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentAllocation extends Document {
  paymentId: mongoose.Types.ObjectId;
  invoiceId: mongoose.Types.ObjectId;
  amountCents: number;
  createdAt: Date;
}

const paymentAllocationSchema = new Schema<IPaymentAllocation>(
  {
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    amountCents: { type: Number, required: true, min: 1 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Field-level indexes already declared

export const PaymentAllocation = mongoose.model<IPaymentAllocation>(
  'PaymentAllocation',
  paymentAllocationSchema
);
