import { Router, Request, Response } from 'express';
import { stockLevelUpdateSchema } from '@i-itsm/shared';
import { requireRole, validateRequest } from '../../middlewares';
import stockLevelController from './stockLevel.controller';

const router = Router();

// Get stock level by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    await stockLevelController.getStockLevel(req, res);
});

// List stock levels
router.get('/', async (req: Request, res: Response): Promise<void> => {
    await stockLevelController.listStockLevels(req, res);
});

// Update stock level (admin or support)
router.patch('/:id', requireRole('admin', 'support'), validateRequest(stockLevelUpdateSchema), async (req: Request, res: Response): Promise<void> => {
    await stockLevelController.updateStockLevel(req, res);
});

export default router;
