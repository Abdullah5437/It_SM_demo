import type { AuthUser } from './common';

export interface RequestContext {
  user?: AuthUser;
  ip: string;
  userAgent?: string;
  requestId: string;
  startTime: number;
}

export interface AuditLogEntry {
  id: string;
  actorUserId: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'other';
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip: string;
  createdAt: Date;
}
