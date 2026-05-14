import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authenticate, requireRole } from '../../middlewares';

const router = Router();

// All payment routes require authentication and accounts/admin role
router.use(authenticate);
router.use(requireRole('accounts', 'admin'));

// Create payment
router.post(
  '/',
  (req, res, next) => paymentController.createPayment(req, res, next)
);

// List payments
router.get('/', (req, res, next) => paymentController.listPayments(req, res, next));

// Get payment
router.get('/:id', (req, res, next) => paymentController.getPayment(req, res, next));

// Confirm payment
router.post(
  '/:id/confirm',
  (req, res, next) => paymentController.confirmPayment(req, res, next)
);

// Allocate payment to invoice
router.post(
  '/:paymentId/allocate',
  (req, res, next) => paymentController.allocatePayment(req, res, next)
);

// Auto-allocate payment
router.post(
  '/:paymentId/auto-allocate',
  (req, res, next) => paymentController.autoAllocatePayment(req, res, next)
);

// List allocations for payment
router.get('/:paymentId/allocations', (req, res, next) => paymentController.listAllocations(req, res, next));

export const paymentRoutes = router;
