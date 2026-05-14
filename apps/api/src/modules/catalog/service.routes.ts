import { Router } from 'express';
import { serviceController } from './service.controller';
import { authenticate, requireRole } from '../../middlewares';

const router = Router();

/**
 * GET /api/v1/catalog/services
 * List services with filters
 */
router.get(
  '/',
  authenticate,
  requireRole('admin', 'accounts', 'support', 'sales'),
  (req, res, next) => serviceController.list(req, res, next)
);

/**
 * POST /api/v1/catalog/services
 * Create a new service
 */
router.post(
  '/',
  authenticate,
  requireRole('admin', 'accounts'),
  (req, res, next) => serviceController.create(req, res, next)
);

/**
 * GET /api/v1/catalog/services/:id
 * Get a service by ID
 */
router.get(
  '/:id',
  authenticate,
  requireRole('admin', 'accounts', 'support', 'sales'),
  (req, res, next) => serviceController.getById(req, res, next)
);

/**
 * PATCH /api/v1/catalog/services/:id
 * Update a service
 */
router.patch(
  '/:id',
  authenticate,
  requireRole('admin', 'accounts'),
  (req, res, next) => serviceController.update(req, res, next)
);

/**
 * DELETE /api/v1/catalog/services/:id
 * Delete a service
 */
router.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  (req, res, next) => serviceController.delete(req, res, next)
);

export const serviceRoutes = router;
