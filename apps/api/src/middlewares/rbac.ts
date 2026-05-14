import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '@i-itsm/shared';

export type UserRole = 'admin' | 'accounts' | 'support' | 'sales' | 'user';

/**
 * RBAC middleware to check user roles
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    if (!_req.user) {
      throw new ForbiddenError('User not authenticated');
    }

    const hasRole = _req.user.roles.some(role => allowedRoles.includes(role as UserRole));

    if (!hasRole) {
      throw new ForbiddenError(`This action requires one of the following roles: ${allowedRoles.join(', ')}`);
    }

    next();
  };
}

/**
 * Admin-only middleware
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireRole('admin')(req, res, next);
}

export default { requireRole, requireAdmin };

// Alias for backward compatibility
export const authorizeRoles = requireRole;
