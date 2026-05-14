import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../../middlewares';
import { AuditLog } from './audit.model';

const router = Router();

/**
 * GET /api/v1/audit/logs
 * Get audit logs (admin only)
 */
router.get(
  '/logs',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { entityType, entityId, limit = '50', skip = '0' } = req.query;

      const filter: Record<string, unknown> = {};

      if (entityType) {
        filter.entityType = entityType;
      }

      if (entityId) {
        filter.entityId = entityId;
      }

      const logs = await AuditLog.find(filter)
        .limit(parseInt(limit as string))
        .skip(parseInt(skip as string))
        .sort({ createdAt: -1 })
        .lean();

      const total = await AuditLog.countDocuments(filter);

      res.json({
        success: true,
        data: {
          logs,
          total,
          limit: parseInt(limit as string),
          skip: parseInt(skip as string),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
