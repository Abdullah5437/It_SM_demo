import { Router } from 'express';
import { serviceGroupController } from './serviceGroup.controller';
import { authenticate, requireRole } from '../../middlewares';

const router = Router();

/**
 * GET /api/v1/catalog/service-groups
 * List all service groups
 */
router.get(
  '/',
  authenticate,
  requireRole('admin', 'accounts', 'support', 'sales'),
  (req, res, next) => serviceGroupController.list(req, res, next)
);

/**
 * POST /api/v1/catalog/service-groups
 * Create a new service group
 */
router.post(
  '/',
  authenticate,
  requireRole('admin', 'accounts'),
  (req, res, next) => serviceGroupController.create(req, res, next)
);

/**
 * GET /api/v1/catalog/service-groups/:id
 * Get a service group by ID
 */
router.get(
  '/:id',
  authenticate,
  requireRole('admin', 'accounts', 'support', 'sales'),
  (req, res, next) => serviceGroupController.getById(req, res, next)
);

/**
 * PATCH /api/v1/catalog/service-groups/:id
 * Update a service group
 */
router.patch(
  '/:id',
  authenticate,
  requireRole('admin', 'accounts'),
  (req, res, next) => serviceGroupController.update(req, res, next)
);

/**
 * DELETE /api/v1/catalog/service-groups/:id
 * Delete a service group
 */
router.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  (req, res, next) => serviceGroupController.delete(req, res, next)
);

export const serviceGroupRoutes = router;
