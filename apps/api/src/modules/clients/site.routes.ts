import { Router } from 'express';
import { clientSiteController } from './site.controller';
import { authenticate, requireRole } from '../../middlewares';

const router = Router({ mergeParams: true });

/**
 * GET /api/v1/clients/:clientId/sites
 * List all sites for a client
 */
router.get(
  '/',
  authenticate,
  requireRole('admin', 'accounts', 'support', 'sales'),
  (req, res, next) => clientSiteController.list(req, res, next)
);

/**
 * POST /api/v1/clients/:clientId/sites
 * Create a new site for a client
 */
router.post(
  '/',
  authenticate,
  requireRole('admin', 'accounts'),
  (req, res, next) => clientSiteController.create(req, res, next)
);

/**
 * GET /api/v1/clients/:clientId/sites/:id
 * Get a specific site
 */
router.get(
  '/:id',
  authenticate,
  requireRole('admin', 'accounts', 'support', 'sales'),
  (req, res, next) => clientSiteController.getById(req, res, next)
);

/**
 * PATCH /api/v1/clients/:clientId/sites/:id
 * Update a site
 */
router.patch(
  '/:id',
  authenticate,
  requireRole('admin', 'accounts'),
  (req, res, next) => clientSiteController.update(req, res, next)
);

/**
 * DELETE /api/v1/clients/:clientId/sites/:id
 * Delete a site
 */
router.delete(
  '/:id',
  authenticate,
  requireRole('admin', 'accounts'),
  (req, res, next) => clientSiteController.delete(req, res, next)
);

export const clientSiteRoutes = router;
