import { Request, Response } from 'express';
import stockMovementService from './stockMovement.service';

export class StockMovementController {
    // Create stock movement
    async createStockMovement(req: Request, res: Response): Promise<void> {
        try {
            const movement = await stockMovementService.createStockMovement({
                ...req.body,
                createdBy: req.user?.userId,
                requestIp: req.ip
            });
            res.status(201).send(movement);
        } catch (error) {
            res.status(400).send(error);
        }
    }

    // Get stock movement by ID
    async getStockMovement(req: Request, res: Response): Promise<void> {
        try {
            const movement = await stockMovementService.getStockMovementById(req.params.id);
            if (!movement) {
                res.status(404).send({ message: 'Stock movement not found' });
                return;
            }
            res.send(movement);
        } catch (error) {
            res.status(500).send(error);
        }
    }

    // List stock movements
    async listStockMovements(req: Request, res: Response): Promise<void> {
        try {
            const movements = await stockMovementService.listStockMovements(req.query);
            res.send(movements);
        } catch (error) {
            res.status(500).send(error);
        }
    }

    // Get movement history
    async getMovementHistory(req: Request, res: Response): Promise<void> {
        try {
            const { productId, warehouseId, limit } = req.query;
            if (!productId || !warehouseId) {
                res.status(400).send({ message: 'productId and warehouseId are required' });
                return;
            }
            const movements = await stockMovementService.getMovementHistory(
                productId as string,
                warehouseId as string,
                parseInt(limit as string) || 50
            );
            res.send(movements);
        } catch (error) {
            res.status(500).send(error);
        }
    }
}

export default new StockMovementController();
