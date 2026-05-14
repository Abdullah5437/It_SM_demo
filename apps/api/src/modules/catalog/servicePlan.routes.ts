import { Router } from 'express';
import { servicePlanController } from './servicePlan.controller';
import { authenticate, requireRole } from '../../middlewares';

const router = Router();

/**
 * GET /api/v1/catalog/service-plans
 * List service plans with filters
 */
router.get(
  '/',
  authenticate,
  requireRole('admin', 'accounts', 'support', 'sales'),
  (req, res, next) => servicePlanController.list(req, res, next)
);

/**
 * POST /api/v1/catalog/service-plans
 * Create a new service plan
 */
router.post(
  '/',
  authenticate,
  requireRole('admin', 'accounts'),
  (req, res, next) => servicePlanController.create(req, res, next)
);

/**
 * GET /api/v1/catalog/service-plans/:id
 * Get a service plan by ID
 */
router.get(
  '/:id',
  authenticate,
  requireRole('admin', 'accounts', 'support', 'sales'),
  (req, res, next) => servicePlanController.getById(req, res, next)
);

/**
 * PATCH /api/v1/catalog/service-plans/:id
 * Update a service plan
 */
router.patch(
  '/:id',
  authenticate,
  requireRole('admin', 'accounts'),
  (req, res, next) => servicePlanController.update(req, res, next)
);

/**
 * DELETE /api/v1/catalog/service-plans/:id
 * Delete a service plan
 */
router.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  (req, res, next) => servicePlanController.delete(req, res, next)
);

export const servicePlanRoutes = router;
