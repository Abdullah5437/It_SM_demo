import { Router } from 'express';
import { clientController } from './client.controller';
import { holdingsController } from './holdings.controller';
import { authenticate, requireRole } from '../../middlewares';

const router = Router();

/**
 * GET /api/v1/clients
 * List all clients (accessible by admin, accounts, support, sales)
 */
router.get(
  '/',
  authenticate,
  requireRole('admin', 'accounts', 'support', 'sales'),
  (req, res, next) => clientController.list(req, res, next)
);

/**
 * POST /api/v1/clients
 * Create a new client (accessible by admin, accounts)
 */
router.post(
  '/',
  authenticate,
  requireRole('admin', 'accounts'),
  (req, res, next) => clientController.create(req, res, next)
);

/**
 * GET /api/v1/clients/:id/holdings
 * Get aggregated holdings for a client
 */
router.get(
  '/:id/holdings',
  authenticate,
  requireRole('admin', 'accounts', 'support', 'sales'),
  (req, res, next) => holdingsController.getHoldings(req, res, next)
);

/**
 * GET /api/v1/clients/:id
 * Get client by ID (accessible by admin, accounts, support, sales)
 */
router.get(
  '/:id',
  authenticate,
  requireRole('admin', 'accounts', 'support', 'sales'),
  (req, res, next) => clientController.getById(req, res, next)
);

/**
 * PATCH /api/v1/clients/:id
 * Update a client (accessible by admin, accounts)
 */
router.patch(
  '/:id',
  authenticate,
  requireRole('admin', 'accounts'),
  (req, res, next) => clientController.update(req, res, next)
);

/**
 * DELETE /api/v1/clients/:id
 * Delete a client (accessible by admin only)
 */
router.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  (req, res, next) => clientController.delete(req, res, next)
);

export const clientRoutes = router;
