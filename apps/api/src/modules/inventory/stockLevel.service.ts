import StockLevel, { IStockLevel } from './stockLevel.model';
import { logger } from '../../utils/logger';

export class StockLevelService {
    // Create stock level
    async createStockLevel(data: Partial<IStockLevel>): Promise<IStockLevel> {
        const stockLevel = new StockLevel(data);
        const saved = await stockLevel.save();
        logger.info({ action: 'create', entity: 'StockLevel', id: saved._id, data: saved }, 'StockLevel created');
        return saved;
    }

    // Get stock level by ID
    async getStockLevelById(id: string): Promise<IStockLevel | null> {
        return StockLevel.findById(id).populate('productId warehouseId');
    }

    // Get stock level by product and warehouse
    async getStockLevel(productId: string, warehouseId: string): Promise<IStockLevel | null> {
        return StockLevel.findOne({ productId, warehouseId }).populate('productId warehouseId');
    }

    // List stock levels with filters
    async listStockLevels(filters: any = {}): Promise<IStockLevel[]> {
        return StockLevel.find(filters).populate('productId warehouseId');
    }

    // Update stock level
    async updateStockLevel(id: string, data: Partial<IStockLevel>): Promise<IStockLevel | null> {
        const updated = await StockLevel.findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true, runValidators: true }).populate('productId warehouseId');
        if (updated) logger.info({ action: 'update', entity: 'StockLevel', id, data }, 'StockLevel updated');
        return updated;
    }

    // Update quantity on hand
    async updateQtyOnHand(productId: string, warehouseId: string, delta: number): Promise<IStockLevel | null> {
        const stockLevel = await StockLevel.findOneAndUpdate(
            { productId, warehouseId },
            { $inc: { qtyOnHand: delta }, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).populate('productId warehouseId');
        if (stockLevel) logger.info({ action: 'update', entity: 'StockLevel', productId, warehouseId, delta }, 'StockLevel qtyOnHand updated');
        return stockLevel;
    }

    // Update reserved quantity
    async updateQtyReserved(productId: string, warehouseId: string, delta: number): Promise<IStockLevel | null> {
        const stockLevel = await StockLevel.findOneAndUpdate(
            { productId, warehouseId },
            { $inc: { qtyReserved: delta }, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).populate('productId warehouseId');
        if (stockLevel) logger.info({ action: 'update', entity: 'StockLevel', productId, warehouseId, delta }, 'StockLevel qtyReserved updated');
        return stockLevel;
    }

    // Check availability
    async checkAvailability(productId: string, warehouseId: string, qty: number): Promise<boolean> {
        const stockLevel = await this.getStockLevel(productId, warehouseId);
        if (!stockLevel) return false;
        return stockLevel.qtyOnHand >= qty;
    }

    // Delete stock level
    async deleteStockLevel(id: string): Promise<IStockLevel | null> {
        const deleted = await StockLevel.findByIdAndDelete(id);
        if (deleted) logger.info({ action: 'delete', entity: 'StockLevel', id }, 'StockLevel deleted');
        return deleted;
    }
}

export default new StockLevelService();
