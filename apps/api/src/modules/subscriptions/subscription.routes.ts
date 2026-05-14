import { Router } from 'express';
import { authenticate, requireRole, validateRequest } from '../../middlewares';
import subscriptionController from './subscription.controller';
import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  listSubscriptionsSchema,
} from '@i-itsm/shared';

const router = Router();

// All subscription endpoints require authentication
router.use(authenticate);

/**
 * POST /api/v1/subscriptions
 * Create a new subscription
 */
router.post(
  '/',
  requireRole('accounts', 'admin'),
  validateRequest(createSubscriptionSchema),
  subscriptionController.createSubscription.bind(subscriptionController)
);

/**
 * GET /api/v1/subscriptions
 * List subscriptions with filters
 */
router.get(
  '/',
  requireRole('accounts', 'admin', 'user'),
  subscriptionController.listSubscriptions.bind(subscriptionController)
);

/**
 * GET /api/v1/subscriptions/:id
 * Get a specific subscription
 */
router.get(
  '/:id',
  requireRole('accounts', 'admin', 'user'),
  subscriptionController.getSubscription.bind(subscriptionController)
);

/**
 * PATCH /api/v1/subscriptions/:id
 * Update a subscription
 */
router.patch(
  '/:id',
  requireRole('accounts', 'admin'),
  validateRequest(updateSubscriptionSchema),
  subscriptionController.updateSubscription.bind(subscriptionController)
);

/**
 * POST /api/v1/subscriptions/:id/pause
 * Pause a subscription
 */
router.post(
  '/:id/pause',
  requireRole('accounts', 'admin'),
  subscriptionController.pauseSubscription.bind(subscriptionController)
);

/**
 * POST /api/v1/subscriptions/:id/resume
 * Resume a paused subscription
 */
router.post(
  '/:id/resume',
  requireRole('accounts', 'admin'),
  subscriptionController.resumeSubscription.bind(subscriptionController)
);

/**
 * POST /api/v1/subscriptions/:id/cancel
 * Cancel a subscription
 */
router.post(
  '/:id/cancel',
  requireRole('accounts', 'admin'),
  subscriptionController.cancelSubscription.bind(subscriptionController)
);

/**
 * GET /api/v1/subscriptions/summary/:clientId
 * Get subscription summary for a client
 */
router.get(
  '/summary/:clientId',
  requireRole('accounts', 'admin', 'user'),
  subscriptionController.getSubscriptionSummary.bind(subscriptionController)
);

export default router;
