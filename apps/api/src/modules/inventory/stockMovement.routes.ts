import { Router, Request, Response } from 'express';
import { stockMovementCreateSchema } from '@i-itsm/shared';
import { requireRole, validateRequest } from '../../middlewares';
import stockMovementController from './stockMovement.controller';

const router = Router();

// Create stock movement (admin or support)
router.post('/', requireRole('admin', 'support'), validateRequest(stockMovementCreateSchema), async (req: Request, res: Response): Promise<void> => {
    await stockMovementController.createStockMovement(req, res);
});

// Get stock movement by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    await stockMovementController.getStockMovement(req, res);
});

// List stock movements
router.get('/', async (req: Request, res: Response): Promise<void> => {
    await stockMovementController.listStockMovements(req, res);
});

// Get movement history
router.get('/history/:productId/:warehouseId', async (req: Request, res: Response): Promise<void> => {
    await stockMovementController.getMovementHistory(req, res);
});

export default router;
