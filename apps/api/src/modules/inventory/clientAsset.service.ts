import ClientAsset, { IClientAsset } from './clientAsset.model';
import SerializedItem from './serializedItem.model';
import { Schema } from 'mongoose';
import mongoose from 'mongoose';
import { logger } from '../../utils/logger';
import { writeAudit } from '../../middlewares/audit';

const isTransientMongoError = (error: any): boolean => {
    const codeName = (error as any)?.codeName;
    const labels: string[] | undefined = (error as any)?.errorLabelSet ? Array.from((error as any).errorLabelSet) : (error as any)?.errorLabels;
    const message: string = (error as any)?.message || '';
    return codeName === 'WriteConflict'
        || labels?.includes('TransientTransactionError')
        || message.includes('Unable to acquire IX lock');
};

export class ClientAssetService {
    // Create client asset
    async createClientAsset(data: Partial<IClientAsset>, requestIp?: string): Promise<IClientAsset> {
        const maxRetries = 5;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                const asset = new ClientAsset(data);
                await asset.save({ session });

                // If serialized item provided, update its status to assigned
                if (data.serializedItemId) {
                    await SerializedItem.findByIdAndUpdate(
                        data.serializedItemId,
                        { status: 'assigned', warehouseId: null },
                        { new: true, session }
                    );
                }

                await session.commitTransaction();
                logger.info({ action: 'create', entity: 'ClientAsset', id: asset._id, data: asset }, 'ClientAsset created');
                await writeAudit({
                    action: 'create',
                    entityType: 'ClientAsset',
                    entityId: asset._id.toString(),
                    after: asset.toObject() as unknown as Record<string, unknown>,
                    userId: data.createdBy,
                    ip: requestIp,
                });
                return asset;
            } catch (error) {
                await session.abortTransaction();
                if (isTransientMongoError(error) && attempt < maxRetries - 1) {
                    continue;
                }
                throw error;
            } finally {
                await session.endSession();
            }
        }
        throw new Error('Failed to create client asset after retries');
    }

    // Get client asset by ID
    async getClientAssetById(id: string): Promise<IClientAsset | null> {
        return ClientAsset.findById(id).populate('clientId clientSiteId productId serializedItemId');
    }

    // Get asset by tag
    async getClientAssetByTag(assetTag: string): Promise<IClientAsset | null> {
        return ClientAsset.findOne({ assetTag }).populate('clientId clientSiteId productId serializedItemId');
    }

    // List client assets with filters
    async listClientAssets(filters: any = {}): Promise<IClientAsset[]> {
        return ClientAsset.find(filters).populate('clientId clientSiteId productId serializedItemId');
    }

    // Update client asset
    async updateClientAsset(id: string, data: Partial<IClientAsset>): Promise<IClientAsset | null> {
        const updated = await ClientAsset.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('clientId clientSiteId productId serializedItemId');
        if (updated) logger.info({ action: 'update', entity: 'ClientAsset', id, data }, 'ClientAsset updated');
        return updated;
    }

    // Retire asset
    async retireAsset(id: string, requestIp?: string): Promise<IClientAsset | null> {
        const maxRetries = 3;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                const before = await ClientAsset.findById(id).session(session).lean();
                const asset = await ClientAsset
                    .findByIdAndUpdate(id, { status: 'retired' }, { new: true, session })
                    .populate('clientId clientSiteId productId serializedItemId');

                // Update serialized item status to scrapped
                if (asset?.serializedItemId) {
                    await SerializedItem.findByIdAndUpdate(asset.serializedItemId, { status: 'scrapped' }, { session });
                }

                await session.commitTransaction();
                if (asset) logger.info({ action: 'retire', entity: 'ClientAsset', id, data: asset }, 'ClientAsset retired');
                if (asset) {
                    await writeAudit({
                        action: 'update',
                        entityType: 'ClientAsset',
                        entityId: id,
                        before: (before as unknown as Record<string, unknown>) || undefined,
                        after: asset.toObject() as unknown as Record<string, unknown>,
                        userId: asset.createdBy,
                        ip: requestIp,
                    });
                }
                return asset;
            } catch (error) {
                await session.abortTransaction();
                if (isTransientMongoError(error) && attempt < maxRetries - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1))); // backoff for transient locks
                    continue;
                }
                throw error;
            } finally {
                await session.endSession();
            }
        }
        throw new Error('Failed to retire client asset after retries');
    }

    // Return asset
    async returnAsset(id: string, warehouseId?: string, requestIp?: string): Promise<IClientAsset | null> {
        const maxRetries = 3;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                const before = await ClientAsset.findById(id).lean();
                const asset = await ClientAsset.findByIdAndUpdate(id, { status: 'returned' }, { new: true, session }).populate('clientId clientSiteId productId serializedItemId');

                const normalizedWarehouseId = warehouseId && mongoose.isValidObjectId(warehouseId)
                    ? new mongoose.Types.ObjectId(warehouseId)
                    : null;

                // Update serialized item status back to in_stock
                if (asset?.serializedItemId) {
                    await SerializedItem.findByIdAndUpdate(
                        asset.serializedItemId,
                        { status: 'in_stock', warehouseId: normalizedWarehouseId },
                        { session }
                    );
                }

                await session.commitTransaction();
                if (asset) logger.info({ action: 'return', entity: 'ClientAsset', id, data: asset }, 'ClientAsset returned');
                if (asset) {
                    await writeAudit({
                        action: 'update',
                        entityType: 'ClientAsset',
                        entityId: id,
                        before: (before as unknown as Record<string, unknown>) || undefined,
                        after: asset.toObject() as unknown as Record<string, unknown>,
                        userId: asset.createdBy,
                        ip: requestIp,
                    });
                }
                return asset;
            } catch (error) {
                await session.abortTransaction();
                if (isTransientMongoError(error) && attempt < maxRetries - 1) {
                    continue;
                }
                throw error;
            } finally {
                await session.endSession();
            }
        }
        throw new Error('Failed to return client asset after retries');
    }

    // Get assets by client
    async getAssetsByClient(clientId: string, status?: string): Promise<IClientAsset[]> {
        const filter: any = { clientId };
        if (status) filter.status = status;
        return ClientAsset.find(filter).populate('clientId clientSiteId productId serializedItemId');
    }

    // Get expiring warranties
    async getExpiringWarranties(daysAhead: number = 30): Promise<IClientAsset[]> {
        const today = new Date();
        const futureDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);

        return ClientAsset.find({
            status: 'active',
            warrantyEnd: { $gte: today, $lte: futureDate }
        }).populate('clientId clientSiteId productId serializedItemId');
    }

    // Get expired warranties
    async getExpiredWarranties(): Promise<IClientAsset[]> {
        const today = new Date();
        return ClientAsset.find({
            status: 'active',
            warrantyEnd: { $lt: today }
        }).populate('clientId clientSiteId productId serializedItemId');
    }

    // Delete client asset
    async deleteClientAsset(id: string): Promise<IClientAsset | null> {
        const deleted = await ClientAsset.findByIdAndDelete(id);
        if (deleted) logger.info({ action: 'delete', entity: 'ClientAsset', id }, 'ClientAsset deleted');
        return deleted;
    }

    // Count assets by client
    async countAssetsByClient(clientId: string): Promise<number> {
        return ClientAsset.countDocuments({ clientId });
    }

    // Get client asset summary
    async getClientAssetSummary(clientId: string): Promise<any> {
        const totalAssets = await ClientAsset.countDocuments({ clientId });
        const activeAssets = await ClientAsset.countDocuments({ clientId, status: 'active' });
        const retiredAssets = await ClientAsset.countDocuments({ clientId, status: 'retired' });

        const today = new Date();
        const expiredWarranty = await ClientAsset.countDocuments({
            clientId,
            status: 'active',
            warrantyEnd: { $lt: today }
        });

        return {
            clientId,
            totalAssets,
            activeAssets,
            retiredAssets,
            expiredWarranty
        };
    }
}

export default new ClientAssetService();
