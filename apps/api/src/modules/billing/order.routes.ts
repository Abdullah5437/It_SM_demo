import { Router } from 'express';
import { orderController } from './order.controller';
import { authenticate, requireRole } from '../../middlewares';

const router = Router();

router.use(authenticate);
router.use(requireRole('accounts', 'admin'));

router.post(
  '/',
  (req, res, next) => orderController.createOrder(req, res, next)
);

// List orders
router.get('/', (req, res, next) => orderController.listOrders(req, res, next));

// Get order stats
router.get('/stats', (req, res, next) => orderController.getStats(req, res, next));

// Get sales chart data
router.get('/sales-chart', (req, res, next) => orderController.getSalesChart(req, res, next));

// Get product sales data (which products sold most)
router.get('/product-sales', (req, res, next) => orderController.getProductSales(req, res, next));

// Get daily activity data for timeline
router.get('/daily-activity', (req, res, next) => orderController.getDailyActivity(req, res, next));

// Get dashboard slides data
router.get('/dashboard-slides', (req, res, next) => orderController.getDashboardSlides(req, res, next));

// Get order
router.get('/:id', (req, res, next) => orderController.getOrder(req, res, next));

// Update order (pending only)
router.patch(
  '/:id',
  (req, res, next) => orderController.updateOrder(req, res, next)
);

// Complete order (processes and deducts stock)
router.post(
  '/:id/complete',
  (req, res, next) => orderController.completeOrder(req, res, next)
);

// Cancel order
router.post(
  '/:id/cancel',
  (req, res, next) => orderController.cancelOrder(req, res, next)
);

// Delete order
router.delete(
  '/:id',
  (req, res, next) => orderController.deleteOrder(req, res, next)
);

export const orderRoutes = router;
