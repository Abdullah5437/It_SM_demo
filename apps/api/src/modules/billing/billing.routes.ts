import { Router } from 'express';
import { billingController } from './billing.controller';
import { authenticate, requireRole } from '../../middlewares';

const router = Router();

// All billing routes require authentication
router.use(authenticate);
router.use(requireRole('accounts', 'admin', 'user'));

// Get billing summary for client
router.get('/:clientId/summary', billingController.getBillingSummary.bind(billingController));

export const billingRoutes = router;
