import { Document } from 'mongoose';

/**
 * Convert Mongoose document to plain object with _id as string
 */
export function toPlainObject<T extends Record<string, any>>(doc: Document & T): T & { _id: string } {
  const obj = doc.toObject();
  return {
    ...obj,
    _id: obj._id?.toString(),
  };
}
