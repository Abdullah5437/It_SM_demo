import Warehouse, { IWarehouse } from './warehouse.model';
import { logger } from '../../utils/logger';

export class WarehouseService {
    // Create warehouse
    async createWarehouse(data: Partial<IWarehouse>): Promise<IWarehouse> {
        const warehouse = new Warehouse(data);
        const saved = await warehouse.save();
        logger.info({ action: 'create', entity: 'Warehouse', id: saved._id, data: saved }, 'Warehouse created');
        return saved;
    }

    // Get warehouse by ID
    async getWarehouseById(id: string): Promise<IWarehouse | null> {
        return Warehouse.findById(id);
    }

    // Get warehouse by code
    async getWarehouseByCode(code: string): Promise<IWarehouse | null> {
        return Warehouse.findOne({ code });
    }

    // List warehouses with filters
    async listWarehouses(filters: Record<string, unknown> = {}): Promise<IWarehouse[]> {
        return Warehouse.find(filters);
    }

    // Update warehouse
    async updateWarehouse(id: string, data: Partial<IWarehouse>): Promise<IWarehouse | null> {
        const updated = await Warehouse.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        if (updated) logger.info({ action: 'update', entity: 'Warehouse', id, data }, 'Warehouse updated');
        return updated;
    }
}

export default new WarehouseService();
