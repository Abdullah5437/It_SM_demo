import SerializedItem, { ISerializedItem } from './serializedItem.model';
import { logger } from '../../utils/logger';

export class SerializedItemService {
    // Create serialized item
    async createSerializedItem(data: Partial<ISerializedItem>): Promise<ISerializedItem> {
        const item = new SerializedItem(data);
        const saved = await item.save();
        logger.info({ action: 'create', entity: 'SerializedItem', id: saved._id, data: saved }, 'SerializedItem created');
        return saved;
    }

    // Get serialized item by ID
    async getSerializedItemById(id: string): Promise<ISerializedItem | null> {
        return SerializedItem.findById(id).populate('productId warehouseId');
    }

    // Get serialized item by serial number
    async getSerializedItemBySerial(serialNo: string): Promise<ISerializedItem | null> {
        return SerializedItem.findOne({ serialNo }).populate('productId warehouseId');
    }

    // List serialized items with filters
    async listSerializedItems(filters: any = {}): Promise<ISerializedItem[]> {
        return SerializedItem.find(filters).populate('productId warehouseId');
    }

    // Update serialized item
    async updateSerializedItem(id: string, data: Partial<ISerializedItem>): Promise<ISerializedItem | null> {
        const updated = await SerializedItem.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('productId warehouseId');
        if (updated) logger.info({ action: 'update', entity: 'SerializedItem', id, data }, 'SerializedItem updated');
        return updated;
    }

    // Update status
    async updateStatus(id: string, status: 'in_stock' | 'sold' | 'returned' | 'scrapped' | 'assigned'): Promise<ISerializedItem | null> {
        const updated = await SerializedItem.findByIdAndUpdate(id, { status }, { new: true }).populate('productId warehouseId');
        if (updated) logger.info({ action: 'update', entity: 'SerializedItem', id, status }, 'SerializedItem status updated');
        return updated;
    }

    // Get items by product
    async getItemsByProduct(productId: string, status?: string): Promise<ISerializedItem[]> {
        const filter: any = { productId };
        if (status) filter.status = status;
        return SerializedItem.find(filter).populate('productId warehouseId');
    }

    // Get items by warehouse
    async getItemsByWarehouse(warehouseId: string, status?: string): Promise<ISerializedItem[]> {
        const filter: any = { warehouseId };
        if (status) filter.status = status;
        return SerializedItem.find(filter).populate('productId warehouseId');
    }

    // Delete serialized item
    async deleteSerializedItem(id: string): Promise<ISerializedItem | null> {
        const deleted = await SerializedItem.findByIdAndDelete(id);
        if (deleted) logger.info({ action: 'delete', entity: 'SerializedItem', id }, 'SerializedItem deleted');
        return deleted;
    }

    // Count items by status
    async countByStatus(status: string): Promise<number> {
        return SerializedItem.countDocuments({ status });
    }
}

export default new SerializedItemService();
