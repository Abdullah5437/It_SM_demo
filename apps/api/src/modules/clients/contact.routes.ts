import { Router } from 'express';
import { clientContactController } from './contact.controller';
import { authenticate, requireRole } from '../../middlewares';

const router = Router({ mergeParams: true });

/**
 * GET /api/v1/clients/:clientId/contacts
 * List all contacts for a client
 */
router.get(
  '/',
  authenticate,
  requireRole('admin', 'accounts', 'support', 'sales'),
  (req, res, next) => clientContactController.list(req, res, next)
);

/**
 * POST /api/v1/clients/:clientId/contacts
 * Create a new contact for a client
 */
router.post(
  '/',
  authenticate,
  requireRole('admin', 'accounts'),
  (req, res, next) => clientContactController.create(req, res, next)
);

/**
 * GET /api/v1/clients/:clientId/contacts/:id
 * Get a specific contact
 */
router.get(
  '/:id',
  authenticate,
  requireRole('admin', 'accounts', 'support', 'sales'),
  (req, res, next) => clientContactController.getById(req, res, next)
);

/**
 * PATCH /api/v1/clients/:clientId/contacts/:id
 * Update a contact
 */
router.patch(
  '/:id',
  authenticate,
  requireRole('admin', 'accounts'),
  (req, res, next) => clientContactController.update(req, res, next)
);

/**
 * DELETE /api/v1/clients/:clientId/contacts/:id
 * Delete a contact
 */
router.delete(
  '/:id',
  authenticate,
  requireRole('admin', 'accounts'),
  (req, res, next) => clientContactController.delete(req, res, next)
);

export const clientContactRoutes = router;
