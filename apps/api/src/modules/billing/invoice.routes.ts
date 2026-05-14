import { Router } from 'express';
import { invoiceController } from './invoice.controller';
import { authenticate, requireRole } from '../../middlewares';

const router = Router();

// All invoice routes require authentication and accounts/admin role
router.use(authenticate);
router.use(requireRole('accounts', 'admin'));

// Create invoice
router.post(
  '/',
  (req, res, next) => invoiceController.createInvoice(req, res, next)
);

// List invoices
router.get('/', (req, res, next) => invoiceController.listInvoices(req, res, next));

// Get invoice
router.get('/:id', (req, res, next) => invoiceController.getInvoice(req, res, next));

// Update invoice (draft only)
router.patch(
  '/:id',
  (req, res, next) => invoiceController.updateInvoice(req, res, next)
);

// Issue invoice
router.post(
  '/:id/issue',
  (req, res, next) => invoiceController.issueInvoice(req, res, next)
);

// Void invoice
router.post(
  '/:id/void',
  (req, res, next) => invoiceController.voidInvoice(req, res, next)
);

// Get invoice PDF
router.get('/:id/pdf', (req, res, next) => invoiceController.getInvoicePDF(req, res, next));

export const invoiceRoutes = router;
