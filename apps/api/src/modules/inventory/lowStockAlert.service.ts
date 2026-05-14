import StockLevel from './stockLevel.model';
import logger from '../../utils/logger';

export interface LowStockAlert {
    productId: string;
    warehouseId: string;
    currentStock: number;
    reorderPoint: number;
    reorderQty: number;
    alertedAt: Date;
}

export class LowStockAlertService {
    /**
     * Check all stock levels for low stock conditions
     * Trigger when qtyOnHand <= reorderPoint
     * Log alert for admin review
     */
    async checkLowStockLevels(): Promise<LowStockAlert[]> {
        try {
            const alerts: LowStockAlert[] = [];

            // Find all stock levels where qtyOnHand <= reorderPoint
            const lowStockItems = await StockLevel.find({
                $expr: { $lte: ['$qtyOnHand', '$reorderPoint'] }
            }).populate('productId warehouseId');

            for (const item of lowStockItems) {
                const alert: LowStockAlert = {
                    productId: item.productId.toString(),
                    warehouseId: item.warehouseId.toString(),
                    currentStock: item.qtyOnHand,
                    reorderPoint: item.reorderPoint,
                    reorderQty: item.reorderQty,
                    alertedAt: new Date()
                };

                alerts.push(alert);

                // Log alert for admin review
                logger.warn(`[LOW STOCK ALERT] Product: ${item.productId}, Warehouse: ${item.warehouseId}`, {
                    currentStock: item.qtyOnHand,
                    reorderPoint: item.reorderPoint,
                    reorderQty: item.reorderQty,
                    suggestedOrder: item.reorderQty
                });
            }

            return alerts;
        } catch (error) {
            logger.error('[LOW STOCK CHECK ERROR]', error);
            return [];
        }
    }

    /**
     * Check low stock for a specific product
     */
    async checkProductLowStock(productId: string): Promise<LowStockAlert | null> {
        try {
            const stockLevel = await StockLevel.findOne({
                productId
            }).populate('productId warehouseId');

            if (!stockLevel) {
                return null;
            }

            if (stockLevel.qtyOnHand <= stockLevel.reorderPoint) {
                const alert: LowStockAlert = {
                    productId: stockLevel.productId.toString(),
                    warehouseId: stockLevel.warehouseId.toString(),
                    currentStock: stockLevel.qtyOnHand,
                    reorderPoint: stockLevel.reorderPoint,
                    reorderQty: stockLevel.reorderQty,
                    alertedAt: new Date()
                };

                logger.warn(`[LOW STOCK ALERT] Product: ${productId}`, {
                    currentStock: stockLevel.qtyOnHand,
                    reorderPoint: stockLevel.reorderPoint,
                    reorderQty: stockLevel.reorderQty
                });

                return alert;
            }

            return null;
        } catch (error) {
            logger.error('[PRODUCT LOW STOCK CHECK ERROR]', error);
            return null;
        }
    }

    /**
     * Check low stock for a specific warehouse
     */
    async checkWarehouseLowStock(warehouseId: string): Promise<LowStockAlert[]> {
        try {
            const alerts: LowStockAlert[] = [];

            const lowStockItems = await StockLevel.find({
                warehouseId,
                $expr: { $lte: ['$qtyOnHand', '$reorderPoint'] }
            }).populate('productId');

            for (const item of lowStockItems) {
                const alert: LowStockAlert = {
                    productId: item.productId.toString(),
                    warehouseId: item.warehouseId.toString(),
                    currentStock: item.qtyOnHand,
                    reorderPoint: item.reorderPoint,
                    reorderQty: item.reorderQty,
                    alertedAt: new Date()
                };

                alerts.push(alert);

                logger.warn(`[WAREHOUSE LOW STOCK ALERT] Product: ${item.productId}, Warehouse: ${warehouseId}`, {
                    currentStock: item.qtyOnHand,
                    reorderPoint: item.reorderPoint,
                    reorderQty: item.reorderQty
                });
            }

            return alerts;
        } catch (error) {
            logger.error('[WAREHOUSE LOW STOCK CHECK ERROR]', error);
            return [];
        }
    }

    /**
     * Check and log a single product+warehouse low stock event
     */
    async checkAndLogSingle(productId: string, warehouseId: string): Promise<void> {
        try {
            const stockLevel = await StockLevel.findOne({ productId, warehouseId });
            if (!stockLevel) return;

            if (stockLevel.qtyOnHand <= stockLevel.reorderPoint) {
                logger.warn(`[LOW STOCK ALERT] Product: ${productId}, Warehouse: ${warehouseId}`, {
                    currentStock: stockLevel.qtyOnHand,
                    reorderPoint: stockLevel.reorderPoint,
                    reorderQty: stockLevel.reorderQty
                });
            }
        } catch (error) {
            logger.error('[LOW STOCK SINGLE CHECK ERROR]', error);
        }
    }

    /**
     * Get critically low stock items (< 50% of reorder point)
     */
    async getCriticallyLowStock(): Promise<LowStockAlert[]> {
        try {
            const alerts: LowStockAlert[] = [];

            // Using aggregation to calculate 50% of reorder point
            const criticalItems = await StockLevel.aggregate([
                {
                    $addFields: {
                        criticalThreshold: { $multiply: ['$reorderPoint', 0.5] }
                    }
                },
                {
                    $match: {
                        $expr: { $lte: ['$qtyOnHand', '$criticalThreshold'] }
                    }
                }
            ]);

            for (const item of criticalItems) {
                const alert: LowStockAlert = {
                    productId: item.productId.toString(),
                    warehouseId: item.warehouseId.toString(),
                    currentStock: item.qtyOnHand,
                    reorderPoint: item.reorderPoint,
                    reorderQty: item.reorderQty,
                    alertedAt: new Date()
                };

                alerts.push(alert);

                logger.error(`[CRITICAL STOCK ALERT] Product: ${item.productId}, Warehouse: ${item.warehouseId}`, {
                    currentStock: item.qtyOnHand,
                    reorderPoint: item.reorderPoint,
                    criticalThreshold: item.criticalThreshold
                });
            }

            return alerts;
        } catch (error) {
            logger.error('[CRITICAL STOCK CHECK ERROR]', error);
            return [];
        }
    }

    /**
     * Get all products with overstocked inventory (qtyOnHand > 2x reorder point)
     * Useful for inventory optimization
     */
    async getOverstockedItems(): Promise<any[]> {
        try {
            const overstocked = await StockLevel.aggregate([
                {
                    $addFields: {
                        overstockThreshold: { $multiply: ['$reorderPoint', 2] }
                    }
                },
                {
                    $match: {
                        $expr: { $gte: ['$qtyOnHand', '$overstockThreshold'] }
                    }
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'productId',
                        foreignField: '_id',
                        as: 'product'
                    }
                }
            ]);

            return overstocked;
        } catch (error) {
            logger.error('[OVERSTOCK CHECK ERROR]', error);
            return [];
        }
    }

    /**
     * Get inventory health summary
     */
    async getInventoryHealthSummary(): Promise<any> {
        try {
            const totalItems = await StockLevel.countDocuments();
            const lowStockItems = await StockLevel.countDocuments({
                $expr: { $lte: ['$qtyOnHand', '$reorderPoint'] }
            });
            const outOfStockItems = await StockLevel.countDocuments({
                qtyOnHand: 0
            });

            const criticalItems = await StockLevel.aggregate([
                {
                    $addFields: {
                        criticalThreshold: { $multiply: ['$reorderPoint', 0.5] }
                    }
                },
                {
                    $match: {
                        $expr: { $lte: ['$qtyOnHand', '$criticalThreshold'] }
                    }
                },
                {
                    $count: 'count'
                }
            ]);

            const totalStockValue = await StockLevel.aggregate([
                {
                    $group: {
                        _id: null,
                        totalValue: { $sum: { $multiply: ['$qtyOnHand', 100] } } // Placeholder calculation
                    }
                }
            ]);

            return {
                totalStockLevels: totalItems,
                lowStockCount: lowStockItems,
                outOfStockCount: outOfStockItems,
                criticalStockCount: criticalItems[0]?.count || 0,
                estimatedTotalValue: totalStockValue[0]?.totalValue || 0,
                health: this.calculateHealthScore(totalItems, lowStockItems, outOfStockItems)
            };
        } catch (error) {
            logger.error('[INVENTORY HEALTH SUMMARY ERROR]', error);
            return null;
        }
    }

    /**
     * Calculate health score (0-100)
     * 100 = all items in good stock
     * 0 = many out of stock items
     */
    private calculateHealthScore(total: number, lowStock: number, outOfStock: number): number {
        if (total === 0) return 100;

        const lowStockPenalty = (lowStock / total) * 30;
        const outOfStockPenalty = (outOfStock / total) * 70;

        return Math.max(0, 100 - lowStockPenalty - outOfStockPenalty);
    }
}

export default new LowStockAlertService();
