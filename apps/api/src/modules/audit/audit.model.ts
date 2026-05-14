import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  actorUserId?: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'other';
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorUserId: String,
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'other'],
      required: true,
      index: true,
    },
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    ip: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    strict: true,
  }
);

// Create indexes
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ actorUserId: 1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);

