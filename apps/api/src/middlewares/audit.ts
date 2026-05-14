import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AuditLog } from '../modules/audit/audit.model';

export interface AuditContext {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

/**
 * Audit logging middleware to track mutations
 * This middleware attaches audit context to requests for later use in handlers
 */
export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  // Store original res.json to wrap it
  const originalJson = res.json.bind(res);

  res.json = function (body: unknown) {
    // Log successful mutations
    if (['POST', 'PATCH', 'DELETE'].includes(req.method) && res.statusCode < 400) {
      logger.info('Audit log', {
        userId: req.user?.userId,
        action: req.method,
        path: req.path,
        statusCode: res.statusCode,
      });
    }

    return originalJson(body);
  };

  next();
}

/**
 * Persist an audit entry
 */
export async function writeAudit(options: {
  action: 'create' | 'update' | 'delete' | 'other';
  entityType: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  userId?: string;
  ip?: string;
}): Promise<void> {
  const { action, entityType, entityId, before, after, userId, ip } = options;
  await AuditLog.create({
    actorUserId: userId,
    entityType,
    entityId,
    action,
    before,
    after,
    ip,
  });
}

export default auditLogger;
