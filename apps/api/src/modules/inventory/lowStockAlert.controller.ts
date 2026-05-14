import { Request, Response } from 'express';
import lowStockAlertService from './lowStockAlert.service';

export class LowStockAlertController {
    async checkAll(req: Request, res: Response): Promise<void> {
        try {
            const alerts = await lowStockAlertService.checkLowStockLevels();
            res.send(alerts);
        } catch (error) {
            res.status(500).send({ message: (error as Error).message });
        }
    }

    async checkWarehouse(req: Request, res: Response): Promise<void> {
        try {
            const { warehouseId } = req.params;
            const alerts = await lowStockAlertService.checkWarehouseLowStock(warehouseId);
            res.send(alerts);
        } catch (error) {
            res.status(500).send({ message: (error as Error).message });
        }
    }

    async checkProduct(req: Request, res: Response): Promise<void> {
        try {
            const { productId } = req.params;
            const alert = await lowStockAlertService.checkProductLowStock(productId);
            if (!alert) {
                res.status(404).send({ message: 'No low stock alert for product' });
                return;
            }
            res.send(alert);
        } catch (error) {
            res.status(500).send({ message: (error as Error).message });
        }
    }
}

export default new LowStockAlertController();
