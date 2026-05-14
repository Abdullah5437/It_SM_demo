import { Router } from 'express';
import { quoteController } from './quote.controller';
import { authenticate, requireRole } from '../../middlewares';

const router = Router();

// All quote routes require authentication and accounts/admin role
router.use(authenticate);
router.use(requireRole('accounts', 'admin'));

// Create quote
router.post(
  '/',
  (req, res, next) => quoteController.createQuote(req, res, next)
);

// List quotes
router.get('/', (req, res, next) => quoteController.listQuotes(req, res, next));

// Get quote
router.get('/:id', (req, res, next) => quoteController.getQuote(req, res, next));

// Update quote (draft only)
router.patch(
  '/:id',
  (req, res, next) => quoteController.updateQuote(req, res, next)
);

// Delete quote (draft only)
router.delete('/:id', (req, res, next) => quoteController.deleteQuote(req, res, next));

// Issue quote
router.post('/:id/issue', (req, res, next) => quoteController.issueQuote(req, res, next));

// Convert to order
router.post(
  '/:id/to-order',
  (req, res, next) => quoteController.convertToOrder(req, res, next)
);

export const quoteRoutes = router;
