import { Router, Request, Response } from 'express';
import { requireRole } from '../../middlewares';
import lowStockAlertController from './lowStockAlert.controller';

const router = Router();

// Get all low stock alerts (admin/support)
router.get('/', requireRole('admin', 'support'), async (req: Request, res: Response): Promise<void> => {
    await lowStockAlertController.checkAll(req, res);
});

// Get low stock alerts for a warehouse
router.get('/warehouse/:warehouseId', requireRole('admin', 'support'), async (req: Request, res: Response): Promise<void> => {
    await lowStockAlertController.checkWarehouse(req, res);
});

// Get low stock alert for a product
router.get('/product/:productId', requireRole('admin', 'support'), async (req: Request, res: Response): Promise<void> => {
    await lowStockAlertController.checkProduct(req, res);
});

export default router;
