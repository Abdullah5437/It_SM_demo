import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireRole, validateRequest } from '../../middlewares';
import stockAllocationController from './stockAllocation.controller';

const router = Router();

const allocationLineSchema = z.object({
    productId: z.string().min(1),
    warehouseId: z.string().min(1),
    quantity: z.number().int().positive(),
    serializedItemIds: z.array(z.string().min(1)).optional()
});

const allocationSchema = z.object({
    invoiceId: z.string().min(1),
    clientId: z.string().min(1),
    clientSiteId: z.string().optional(),
    lines: z.array(allocationLineSchema).min(1)
});

// Allocate stock for invoice (admin or sales)
router.post('/', requireRole('admin', 'sales'), validateRequest(allocationSchema), async (req: Request, res: Response): Promise<void> => {
    await stockAllocationController.allocate(req, res);
});

export default router;
