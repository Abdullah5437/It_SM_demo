import { Router, Request, Response } from 'express';
import { warehouseCreateSchema, warehouseUpdateSchema } from '@i-itsm/shared';
import { requireRole, validateRequest } from '../../middlewares';
import warehouseController from './warehouse.controller';

const router = Router();

// Create warehouse (admin or support)
router.post('/', requireRole('admin', 'support'), validateRequest(warehouseCreateSchema), async (req: Request, res: Response): Promise<void> => {
    await warehouseController.createWarehouse(req, res);
});

// List warehouses
router.get('/', async (req: Request, res: Response): Promise<void> => {
    await warehouseController.listWarehouses(req, res);
});

// Get warehouse by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    await warehouseController.getWarehouse(req, res);
});

// Update warehouse (admin or support)
router.patch('/:id', requireRole('admin', 'support'), validateRequest(warehouseUpdateSchema), async (req: Request, res: Response): Promise<void> => {
    await warehouseController.updateWarehouse(req, res);
});

export default router;
