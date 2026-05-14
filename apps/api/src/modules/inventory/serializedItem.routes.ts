import { Router, Request, Response } from 'express';
import { serializedItemCreateSchema, serializedItemUpdateSchema } from '@i-itsm/shared';
import { requireRole, validateRequest } from '../../middlewares';
import serializedItemController from './serializedItem.controller';

const router = Router();

// Create serialized item (admin or support)
router.post('/', requireRole('admin', 'support'), validateRequest(serializedItemCreateSchema), async (req: Request, res: Response): Promise<void> => {
    await serializedItemController.createSerializedItem(req, res);
});

// List serialized items
router.get('/', async (req: Request, res: Response): Promise<void> => {
    await serializedItemController.listSerializedItems(req, res);
});

// Get serialized item by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    await serializedItemController.getSerializedItem(req, res);
});

// Update serialized item (admin or support)
router.patch('/:id', requireRole('admin', 'support'), validateRequest(serializedItemUpdateSchema), async (req: Request, res: Response): Promise<void> => {
    await serializedItemController.updateSerializedItem(req, res);
});

export default router;
