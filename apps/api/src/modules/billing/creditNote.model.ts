import mongoose, { Schema, Document } from 'mongoose';

export interface ICreditNote extends Document {
  creditNo: string;
  clientId: mongoose.Types.ObjectId;
  invoiceId: mongoose.Types.ObjectId;
  issueDate: Date;
  amountCents: number;
  currency: string;
  reason: 'overpayment' | 'return' | 'discount' | 'other';
  createdAt: Date;
  updatedAt: Date;
}

const creditNoteSchema = new Schema<ICreditNote>(
  {
    creditNo: { type: String, required: true, unique: true, index: true },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    issueDate: { type: Date, required: true },
    amountCents: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true },
    reason: {
      type: String,
      enum: ['overpayment', 'return', 'discount', 'other'],
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const CreditNote = mongoose.model<ICreditNote>(
  'CreditNote',
  creditNoteSchema
);
