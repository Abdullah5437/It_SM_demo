import StockLevel from './stockLevel.model';
import StockMovement from './stockMovement.model';
import SerializedItem from './serializedItem.model';
import ClientAsset, { IClientAsset } from './clientAsset.model';
import Product from './product.model';
import mongoose, { Schema } from 'mongoose';
import { writeAudit } from '../../middlewares/audit';
import lowStockAlertService from './lowStockAlert.service';

export interface InvoiceLine {
    productId: string;
    quantity: number;
    warehouseId: string;
    serializedItemIds?: string[];
}

export interface StockAllocationResult {
    success: boolean;
    invoiceId: string;
    allocations: {
        productId: string;
        quantityAllocated: number;
        serialNumbers?: string[];
        error?: string;
    }[];
    clientAssets?: string[];
}

export class StockAllocationService {
    /**
     * Allocate stock for invoice (Hardware Sale workflow)
     * Performs the following atomically:
     * 1. Check stock availability (qtyOnHand >= qty)
     * 2. Reserve stock (qtyReserved += qty)
     * 3. If serialized tracking: allocate specific serial numbers
     * 4. Create stock movement with reason: sale
     * 5. Create client asset record
     * 6. Update serialized items status
     * 7. Log audit entry
     */
    async allocateStockForInvoice(
        invoiceId: string,
        lines: InvoiceLine[],
        clientId: string,
        clientSiteId?: string,
        createdBy?: string,
        requestIp?: string
    ): Promise<StockAllocationResult> {
        const result: StockAllocationResult = {
            success: true,
            invoiceId,
            allocations: [],
            clientAssets: []
        };

        const maxRetries = 3;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                // Step 1: Check availability for all items first (per warehouse)
                for (const line of lines) {
                    const stockLevel = await StockLevel.findOne({
                        productId: line.productId,
                        warehouseId: line.warehouseId
                    }).session(session);

                    if (!stockLevel || stockLevel.qtyOnHand < line.quantity) {
                        result.allocations.push({
                            productId: line.productId,
                            quantityAllocated: 0,
                            error: `Insufficient stock in warehouse ${line.warehouseId}. Available: ${stockLevel?.qtyOnHand || 0}, Required: ${line.quantity}`
                        });
                        result.success = false;
                    }
                }

                if (!result.success) {
                    await session.abortTransaction();
                    return result;
                }

                // Step 2-7: Process each line
                for (const line of lines) {
                    const product = await this.getProductDetails(line.productId);

                    // Reserve and deduct stock atomically
                    const updatedStockLevel = await StockLevel.findOneAndUpdate(
                        { productId: line.productId, warehouseId: line.warehouseId },
                        {
                            $inc: {
                                qtyOnHand: -line.quantity,
                                qtyReserved: line.quantity
                            },
                            updatedAt: new Date()
                        },
                        { new: true, session }
                    );

                    if (!updatedStockLevel) {
                        throw new Error('Stock level not found for product/warehouse');
                    }

                    // Create stock movement
                    const movement = new StockMovement({
                        productId: line.productId,
                        warehouseId: line.warehouseId,
                        qtyDelta: -line.quantity,
                        reason: 'sale',
                        ref: {
                            type: 'Invoice',
                            id: invoiceId
                        },
                        createdBy
                    });
                    await movement.save({ session });
                    await writeAudit({
                        action: 'create',
                        entityType: 'StockMovement',
                        entityId: movement._id.toString(),
                        after: movement.toObject() as unknown as Record<string, unknown>,
                        userId: createdBy,
                        ip: requestIp,
                    });

                    // Handle serialized items if applicable
                    let serialNumbers: string[] = [];
                    if (product?.trackSerial && line.serializedItemIds?.length) {
                        await SerializedItem.updateMany(
                            { _id: { $in: line.serializedItemIds } },
                            { status: 'sold', warehouseId: null },
                            { session }
                        );
                        serialNumbers = line.serializedItemIds;
                    }

                    // Create client assets for each serialized item or product batch
                    if (product?.trackSerial && line.serializedItemIds && line.serializedItemIds.length > 0) {
                        for (const serialItemId of line.serializedItemIds) {
                            const asset = new ClientAsset({
                                clientId: new mongoose.Types.ObjectId(clientId),
                                clientSiteId: clientSiteId ? new mongoose.Types.ObjectId(clientSiteId) : undefined,
                                productId: new mongoose.Types.ObjectId(line.productId),
                                serializedItemId: new mongoose.Types.ObjectId(serialItemId),
                                assetTag: `${invoiceId}-${serialItemId}`,
                                status: 'active',
                                warrantyStart: new Date(),
                                warrantyEnd: this.calculateWarrantyEnd(new Date()),
                                purchase: {
                                    invoiceId
                                },
                                createdBy
                            });
                            const savedAsset = await asset.save({ session });
                            result.clientAssets!.push(savedAsset._id.toString());
                        }
                    } else {
                        const asset = new ClientAsset({
                            clientId: new mongoose.Types.ObjectId(clientId),
                            clientSiteId: clientSiteId ? new mongoose.Types.ObjectId(clientSiteId) : undefined,
                            productId: new mongoose.Types.ObjectId(line.productId),
                            assetTag: `${invoiceId}-${line.productId}-${Date.now()}`,
                            status: 'active',
                            warrantyStart: new Date(),
                            warrantyEnd: this.calculateWarrantyEnd(new Date()),
                            purchase: {
                                invoiceId
                            },
                            createdBy
                        });
                        const savedAsset = await asset.save({ session });
                        result.clientAssets!.push(savedAsset._id.toString());
                    }

                    result.allocations.push({
                        productId: line.productId,
                        quantityAllocated: line.quantity,
                        serialNumbers
                    });

                    // Low stock trigger per line
                    await lowStockAlertService.checkAndLogSingle(line.productId, line.warehouseId);
                }

                await session.commitTransaction();
                return result;
            } catch (error) {
                await session.abortTransaction();
                if ((error as any)?.codeName === 'WriteConflict' || (error as any)?.errorLabelSet?.has?.('TransientTransactionError')) {
                    if (attempt < maxRetries - 1) {
                        continue;
                    }
                }
                result.success = false;
                if (result.allocations.length === 0) {
                    result.allocations.push({
                        productId: 'unknown',
                        quantityAllocated: 0,
                        error: `Allocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                    });
                }
                return result;
            } finally {
                await session.endSession();
            }
        }

        result.success = false;
        if (result.allocations.length === 0) {
            result.allocations.push({
                productId: 'unknown',
                quantityAllocated: 0,
                error: 'Allocation failed after retries'
            });
        }
        return result;
    }

    /**
     * Reserve stock without creating client assets (for orders/quotes)
     */
    async reserveStock(
        productId: string,
        quantity: number,
        orderId: string,
        createdBy?: string
    ): Promise<boolean> {
        try {
            const stockLevel = await StockLevel.findOne({ productId });

            if (!stockLevel || stockLevel.qtyOnHand < quantity) {
                return false;
            }

            // Update stock level
            await StockLevel.findOneAndUpdate(
                { productId },
                {
                    $inc: { qtyReserved: quantity },
                    updatedAt: new Date()
                }
            );

            // Create movement record
            const movement = new StockMovement({
                productId,
                warehouseId: stockLevel.warehouseId,
                qtyDelta: 0, // No actual stock change, just reservation
                reason: 'adjustment',
                ref: {
                    type: 'Order',
                    id: orderId
                },
                createdBy
            });
            await movement.save();

            return true;
        } catch (error) {
            console.error('Error reserving stock:', error);
            return false;
        }
    }

    /**
     * Release reserved stock (for order cancellations)
     */
    async releaseReservedStock(
        productId: string,
        quantity: number,
        reason: string,
        createdBy?: string
    ): Promise<boolean> {
        try {
            const stockLevel = await StockLevel.findOne({ productId });

            if (!stockLevel || stockLevel.qtyReserved < quantity) {
                return false;
            }

            // Update stock level
            await StockLevel.findOneAndUpdate(
                { productId },
                {
                    $inc: { qtyReserved: -quantity },
                    updatedAt: new Date()
                }
            );

            // Create movement record
            const movement = new StockMovement({
                productId,
                warehouseId: stockLevel.warehouseId,
                qtyDelta: 0,
                reason: 'adjustment',
                ref: {
                    type: 'OrderCancellation',
                    id: reason
                },
                createdBy
            });
            await movement.save();

            return true;
        } catch (error) {
            console.error('Error releasing reserved stock:', error);
            return false;
        }
    }

    /**
     * Complete a sale by finalizing the stock deduction
     */
    async completeSale(
        invoiceId: string,
        createdBy?: string
    ): Promise<boolean> {
        try {
            // Find all movements for this invoice
            const movements = await StockMovement.find({
                'ref.type': 'Invoice',
                'ref.id': invoiceId,
                reason: 'sale'
            });

            // Update each stock level to reduce reserved qty
            for (const movement of movements) {
                await StockLevel.findOneAndUpdate(
                    { productId: movement.productId, warehouseId: movement.warehouseId },
                    {
                        $inc: { qtyReserved: movement.qtyDelta }, // qtyDelta is negative
                        updatedAt: new Date()
                    }
                );
            }

            return true;
        } catch (error) {
            console.error('Error completing sale:', error);
            return false;
        }
    }

    // Helper method to get product details
    private async getProductDetails(productId: string): Promise<any> {
        return Product.findById(productId).lean();
    }

    // Helper method to calculate warranty end date (1 year from now)
    private calculateWarrantyEnd(startDate: Date): Date {
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
        return endDate;
    }
}

export default new StockAllocationService();
