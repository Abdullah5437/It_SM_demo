import { Router } from 'express';
import { serviceAddonController } from './serviceAddon.controller';
import { authenticate, requireRole } from '../../middlewares';

const router = Router();

/**
 * GET /api/v1/catalog/service-addons
 * List service addons with filters
 */
router.get(
  '/',
  authenticate,
  requireRole('admin', 'accounts', 'support', 'sales'),
  (req, res, next) => serviceAddonController.list(req, res, next)
);

/**
 * POST /api/v1/catalog/service-addons
 * Create a new service addon
 */
router.post(
  '/',
  authenticate,
  requireRole('admin', 'accounts'),
  (req, res, next) => serviceAddonController.create(req, res, next)
);

/**
 * GET /api/v1/catalog/service-addons/:id
 * Get a service addon by ID
 */
router.get(
  '/:id',
  authenticate,
  requireRole('admin', 'accounts', 'support', 'sales'),
  (req, res, next) => serviceAddonController.getById(req, res, next)
);

/**
 * PATCH /api/v1/catalog/service-addons/:id
 * Update a service addon
 */
router.patch(
  '/:id',
  authenticate,
  requireRole('admin', 'accounts'),
  (req, res, next) => serviceAddonController.update(req, res, next)
);

/**
 * DELETE /api/v1/catalog/service-addons/:id
 * Delete a service addon
 */
router.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  (req, res, next) => serviceAddonController.delete(req, res, next)
);

export const serviceAddonRoutes = router;
