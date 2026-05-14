import { Request, Response } from 'express';
import warehouseService from './warehouse.service';

export class WarehouseController {
    // Create warehouse
    async createWarehouse(req: Request, res: Response): Promise<void> {
        try {
            const warehouse = await warehouseService.createWarehouse(req.body);
            res.status(201).send(warehouse);
        } catch (error) {
            res.status(400).send(error);
        }
    }

    // Get warehouse by ID
    async getWarehouse(req: Request, res: Response): Promise<void> {
        try {
            const warehouse = await warehouseService.getWarehouseById(req.params.id);
            if (!warehouse) {
                res.status(404).send({ message: 'Warehouse not found' });
                return;
            }
            res.send(warehouse);
        } catch (error) {
            res.status(500).send(error);
        }
    }

    // List warehouses
    async listWarehouses(req: Request, res: Response): Promise<void> {
        try {
            const warehouses = await warehouseService.listWarehouses(req.query);
            res.send(warehouses);
        } catch (error) {
            res.status(500).send(error);
        }
    }

    // Update warehouse
    async updateWarehouse(req: Request, res: Response): Promise<void> {
        try {
            const warehouse = await warehouseService.updateWarehouse(req.params.id, req.body);
            if (!warehouse) {
                res.status(404).send({ message: 'Warehouse not found' });
                return;
            }
            res.send(warehouse);
        } catch (error) {
            res.status(400).send(error);
        }
    }
}

export default new WarehouseController();
