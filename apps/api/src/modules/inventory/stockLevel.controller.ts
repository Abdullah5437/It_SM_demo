import { Request, Response } from 'express';
import stockLevelService from './stockLevel.service';

export class StockLevelController {
    // Create stock level
    async createStockLevel(req: Request, res: Response): Promise<void> {
        try {
            const stockLevel = await stockLevelService.createStockLevel(req.body);
            res.status(201).send(stockLevel);
        } catch (error) {
            res.status(400).send(error);
        }
    }

    // Get stock level by ID
    async getStockLevel(req: Request, res: Response): Promise<void> {
        try {
            const stockLevel = await stockLevelService.getStockLevelById(req.params.id);
            if (!stockLevel) {
                res.status(404).send({ message: 'Stock level not found' });
                return;
            }
            res.send(stockLevel);
        } catch (error) {
            res.status(500).send(error);
        }
    }

    // List stock levels
    async listStockLevels(req: Request, res: Response): Promise<void> {
        try {
            const stockLevels = await stockLevelService.listStockLevels(req.query);
            res.send(stockLevels);
        } catch (error) {
            res.status(500).send(error);
        }
    }

    // Update stock level
    async updateStockLevel(req: Request, res: Response): Promise<void> {
        try {
            const stockLevel = await stockLevelService.updateStockLevel(req.params.id, req.body);
            if (!stockLevel) {
                res.status(404).send({ message: 'Stock level not found' });
                return;
            }
            res.send(stockLevel);
        } catch (error) {
            res.status(400).send(error);
        }
    }
}

export default new StockLevelController();
