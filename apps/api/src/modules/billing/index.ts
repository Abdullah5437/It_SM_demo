import { Router } from 'express';
import { quoteRoutes } from './quote.routes';
import { orderRoutes } from './order.routes';
import { invoiceRoutes } from './invoice.routes';
import { paymentRoutes } from './payment.routes';
import { creditNoteRoutes } from './creditNote.routes';
import { billingRoutes } from './billing.routes';

const router = Router();

// Mount all billing module routes
router.use('/quotes', quoteRoutes);
router.use('/orders', orderRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/credit-notes', creditNoteRoutes);
router.use('/clients', billingRoutes);

export const billingModuleRoutes = router;
