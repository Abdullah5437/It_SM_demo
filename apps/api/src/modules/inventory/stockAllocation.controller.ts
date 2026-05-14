import { Request, Response } from 'express';
import stockAllocationService from './stockAllocation.service';

export class StockAllocationController {
    async allocate(req: Request, res: Response): Promise<void> {
        try {
            const { invoiceId, clientId, clientSiteId, lines } = req.body;
            const result = await stockAllocationService.allocateStockForInvoice(
                invoiceId,
                lines,
                clientId,
                clientSiteId,
                req.user?.userId,
                req.ip
            );

            if (!result.success) {
                res.status(400).send(result);
                return;
            }

            res.status(201).send(result);
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }
}

export default new StockAllocationController();
