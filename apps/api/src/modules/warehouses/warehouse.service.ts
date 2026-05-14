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
    async listWarehouses(filters: any = {}): Promise<IWarehouse[]> {
        return Warehouse.find(filters);
    }

    // Update warehouse
    async updateWarehouse(id: string, data: Partial<IWarehouse>): Promise<IWarehouse | null> {
        const updated = await Warehouse.findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true, runValidators: true });
        if (updated) logger.info({ action: 'update', entity: 'Warehouse', id, data }, 'Warehouse updated');
        return updated;
    }

    // Delete warehouse
    async deleteWarehouse(id: string): Promise<IWarehouse | null> {
        const deleted = await Warehouse.findByIdAndDelete(id);
        if (deleted) logger.info({ action: 'delete', entity: 'Warehouse', id }, 'Warehouse deleted');
        return deleted;
    }

    // Count warehouses
    async countWarehouses(filters: any = {}): Promise<number> {
        return Warehouse.countDocuments(filters);
    }
}

export default new WarehouseService();
