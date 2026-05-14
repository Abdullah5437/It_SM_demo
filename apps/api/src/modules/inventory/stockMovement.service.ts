import StockMovement, { IStockMovement } from './stockMovement.model';
import StockLevel from './stockLevel.model';
import mongoose, { Schema } from 'mongoose';
import { logger } from '../../utils/logger';
import { writeAudit } from '../../middlewares/audit';
import lowStockAlertService from './lowStockAlert.service';

const isTransientMongoError = (error: any): boolean => {
    const codeName = (error as any)?.codeName;
    const labels: string[] | undefined = (error as any)?.errorLabelSet ? Array.from((error as any).errorLabelSet) : (error as any)?.errorLabels;
    const message: string = (error as any)?.message || '';
    return codeName === 'WriteConflict'
        || labels?.includes('TransientTransactionError')
        || labels?.includes('UnknownTransactionCommitResult')
        || message.includes('catalog changes; please retry');
};

export class StockMovementService {
    // Create stock movement (updates stock level atomically)
    async createStockMovement(data: Partial<IStockMovement> & { requestIp?: string }): Promise<IStockMovement> {
        const maxRetries = 3;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                const stockMovement = new StockMovement(data);
                await stockMovement.save({ session });

                // Update stock level atomically with the movement
                if (data.productId && data.warehouseId && data.qtyDelta !== undefined) {
                    await StockLevel.findOneAndUpdate(
                        { productId: data.productId, warehouseId: data.warehouseId },
                        { $inc: { qtyOnHand: data.qtyDelta }, updatedAt: new Date() },
                        { new: true, runValidators: true, upsert: true, session }
                    );
                }

                await session.commitTransaction();
                logger.info({ action: 'create', entity: 'StockMovement', data: stockMovement }, 'StockMovement created');

                // Persist audit entry
                await writeAudit({
                    action: 'create',
                    entityType: 'StockMovement',
                    entityId: stockMovement._id.toString(),
                    after: stockMovement.toObject() as unknown as Record<string, unknown>,
                    userId: (data as any)?.createdBy,
                    ip: data.requestIp,
                });

                // Low stock trigger check
                if (data.productId && data.warehouseId) {
                    await lowStockAlertService.checkAndLogSingle(data.productId.toString(), data.warehouseId.toString());
                }
                return stockMovement;
            } catch (error) {
                await session.abortTransaction();
                if (isTransientMongoError(error) && attempt < maxRetries - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 25 * (attempt + 1))); // brief backoff for transient catalog/lock issues
                    continue;
                }
                throw error;
            } finally {
                await session.endSession();
            }
        }
        throw new Error('Failed to create stock movement after retries');
    }

    // Get stock movement by ID
    async getStockMovementById(id: string): Promise<IStockMovement | null> {
        return StockMovement.findById(id).populate('productId warehouseId');
    }

    // List stock movements with filters
    async listStockMovements(filters: any = {}): Promise<IStockMovement[]> {
        return StockMovement.find(filters).populate('productId warehouseId').sort({ createdAt: -1 });
    }

    // Get movement history for product-warehouse
    async getMovementHistory(productId: string, warehouseId: string, limit: number = 50): Promise<IStockMovement[]> {
        return StockMovement.find({ productId, warehouseId })
            .populate('productId warehouseId')
            .sort({ createdAt: -1 })
            .limit(limit);
    }

    // Count movements by reason
    async countByReason(reason: string): Promise<number> {
        return StockMovement.countDocuments({ reason });
    }

    // Get total quantity delta for product in warehouse over date range
    async getTotalQtyDelta(
        productId: string,
        warehouseId: string,
        fromDate: Date,
        toDate: Date
    ): Promise<number> {
        const result = await StockMovement.aggregate([
            {
                $match: {
                    productId: new Schema.Types.ObjectId(productId),
                    warehouseId: new Schema.Types.ObjectId(warehouseId),
                    createdAt: { $gte: fromDate, $lte: toDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalDelta: { $sum: '$qtyDelta' }
                }
            }
        ]);

        return result.length > 0 ? result[0].totalDelta : 0;
    }

    // Note: Cannot delete stock movements - they are immutable audit trail
}

export default new StockMovementService();
