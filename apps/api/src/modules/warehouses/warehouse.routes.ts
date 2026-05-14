import { Router, Request, Response } from 'express';
import warehouseController from './warehouse.controller';

const router = Router();

// Create warehouse
router.post('/', async (req: Request, res: Response): Promise<void> => {
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

// Update warehouse
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
    await warehouseController.updateWarehouse(req, res);
});

// Delete warehouse
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    await warehouseController.deleteWarehouse(req, res);
});

export default router;