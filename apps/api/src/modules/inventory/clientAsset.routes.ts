import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { clientAssetCreateSchema, clientAssetUpdateSchema } from '@i-itsm/shared';
import { requireRole, validateRequest } from '../../middlewares';
import clientAssetController from './clientAsset.controller';

const router = Router();

// Create client asset (admin or support)
router.post('/', requireRole('admin', 'support'), validateRequest(clientAssetCreateSchema), async (req: Request, res: Response): Promise<void> => {
    await clientAssetController.createClientAsset(req, res);
});

// List client assets
router.get('/', async (req: Request, res: Response): Promise<void> => {
    await clientAssetController.listClientAssets(req, res);
});

// Get expiring warranties
router.get('/warranties/expiring', async (req: Request, res: Response): Promise<void> => {
    await clientAssetController.getExpiringWarranties(req, res);
});

// Get client asset by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    await clientAssetController.getClientAsset(req, res);
});

// Get client asset summary
router.get('/:clientId/summary', async (req: Request, res: Response): Promise<void> => {
    await clientAssetController.getClientAssetSummary(req, res);
});

// Update client asset (admin or support)
router.patch('/:id', requireRole('admin', 'support'), validateRequest(clientAssetUpdateSchema), async (req: Request, res: Response): Promise<void> => {
    await clientAssetController.updateClientAsset(req, res);
});

// Retire asset (admin only)
router.post('/:id/retire', requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
    await clientAssetController.retireAsset(req, res);
});

// Return asset (admin or support)
const returnAssetSchema = z.object({
    warehouseId: z.string().optional()
});

router.post('/:id/return', requireRole('admin', 'support'), validateRequest(returnAssetSchema), async (req: Request, res: Response): Promise<void> => {
    await clientAssetController.returnAsset(req, res);
});

export default router;
