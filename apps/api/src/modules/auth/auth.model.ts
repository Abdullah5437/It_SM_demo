import { Schema, model, Document, Types } from 'mongoose';
import bcryptjs from 'bcryptjs';
import type { UserRole } from '@i-itsm/shared';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  roles: UserRole[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  verifyPassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      index: true,
    },
    roles: [
      {
        type: String,
        enum: ['admin', 'accounts', 'support', 'sales', 'user'],
        default: 'user',
      },
    ],
    lastLoginAt: Date,
  },
  {
    timestamps: true,
    strict: true,
  }
);

/**
 * Instance method to verify password
 */
userSchema.methods.verifyPassword = async function (password: string): Promise<boolean> {
  return bcryptjs.compare(password, this.passwordHash);
};

/**
 * Static method to hash password
 */
userSchema.statics.hashPassword = async (password: string): Promise<string> => {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
};

/**
 * Create indexes
 */
userSchema.index({ email: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

export const User = model<IUser>('User', userSchema);

