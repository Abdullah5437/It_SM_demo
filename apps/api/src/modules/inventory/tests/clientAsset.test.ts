import clientAssetService from '../clientAsset.service';
import ClientAsset from '../clientAsset.model';
import SerializedItem from '../serializedItem.model';
import Product from '../product.model';

describe('Client Asset Service', () => {
    let productId: string;
    let clientId = '507f1f77bcf86cd799439011';
    let serialItemId: string;

    beforeAll(async () => {
        // Create test product
        const product = await Product.create({
            sku: 'ASSET-TEST-001',
            name: 'Asset Test Product',
            type: 'hardware',
            defaultSalePriceCents: 100000,
            defaultCostCents: 50000,
            currency: 'USD',
            trackInventory: true,
            trackSerial: true
        });
        productId = product._id.toString();

        // Create serialized item
        const serialItem = await SerializedItem.create({
            serialNo: `ASSET-SN-${Date.now()}`,
            productId,
            status: 'in_stock'
        });
        serialItemId = serialItem._id.toString();
    });

    afterAll(async () => {
        // Cleanup
        await Product.deleteOne({ _id: productId });
        await SerializedItem.deleteMany({ _id: serialItemId });
        await ClientAsset.deleteMany({ productId });
    });

    test('should create client asset with warranty', async () => {
        const warrantyStart = new Date();
        const warrantyEnd = new Date();
        warrantyEnd.setFullYear(warrantyEnd.getFullYear() + 1);

        const asset = await clientAssetService.createClientAsset({
            clientId: clientId as any,
            productId: productId as any,
            assetTag: `ASSET-${Date.now()}`,
            status: 'active',
            warrantyStart,
            warrantyEnd
        });

        expect(asset).toBeDefined();
        expect(asset.assetTag).toBeDefined();
        expect(asset.status).toBe('active');
        expect(asset.warrantyEnd > asset.warrantyStart).toBe(true);
    });

    test('should update serialized item status when creating asset', async () => {
        const asset = await clientAssetService.createClientAsset({
            clientId: clientId as any,
            productId: productId as any,
            serializedItemId: serialItemId as any,
            assetTag: `ASSET-SERIAL-${Date.now()}`,
            status: 'active',
            warrantyStart: new Date(),
            warrantyEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        });

        const serialItem = await SerializedItem.findById(serialItemId);
        expect(serialItem!.status).toBe('assigned');
        expect(serialItem!.warehouseId).toBeNull();
    });

    test('should retire asset and update serialized item', async () => {
        const newSerialItem = await SerializedItem.create({
            serialNo: `RETIRE-SN-${Date.now()}`,
            productId,
            status: 'in_stock'
        });

        const asset = await clientAssetService.createClientAsset({
            clientId: clientId as any,
            productId: productId as any,
            serializedItemId: newSerialItem._id.toString() as any,
            assetTag: `RETIRE-${Date.now()}`,
            status: 'active',
            warrantyStart: new Date(),
            warrantyEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        });

        const retiredAsset = await clientAssetService.retireAsset(asset._id.toString());
        expect(retiredAsset!.status).toBe('retired');

        const serialItem = await SerializedItem.findById(newSerialItem._id);
        expect(serialItem!.status).toBe('scrapped');
    });

    test('should return asset and restore serialized item', async () => {
        const newSerialItem = await SerializedItem.create({
            serialNo: `RETURN-SN-${Date.now()}`,
            productId,
            status: 'in_stock'
        });

        const asset = await clientAssetService.createClientAsset({
            clientId: clientId as any,
            productId: productId as any,
            serializedItemId: newSerialItem._id.toString() as any,
            assetTag: `RETURN-${Date.now()}`,
            status: 'active',
            warrantyStart: new Date(),
            warrantyEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        });

        const returnedAsset = await clientAssetService.returnAsset(
            asset._id.toString(),
            'warehouse-123'
        );
        expect(returnedAsset!.status).toBe('returned');

        const serialItem = await SerializedItem.findById(newSerialItem._id);
        expect(serialItem!.status).toBe('in_stock');
    });

    test('should find expiring warranties', async () => {
        const warrantyStart = new Date();
        const warrantyEnd = new Date();
        warrantyEnd.setDate(warrantyEnd.getDate() + 15); // Expiring in 15 days

        await clientAssetService.createClientAsset({
            clientId: clientId as any,
            productId: productId as any,
            assetTag: `EXPIRING-${Date.now()}`,
            status: 'active',
            warrantyStart,
            warrantyEnd
        });

        const expiringAssets = await clientAssetService.getExpiringWarranties(30);
        expect(expiringAssets.length).toBeGreaterThan(0);
    });

    test('should find expired warranties', async () => {
        const warrantyStart = new Date();
        warrantyStart.setFullYear(warrantyStart.getFullYear() - 2);
        const warrantyEnd = new Date();
        warrantyEnd.setFullYear(warrantyEnd.getFullYear() - 1);

        await clientAssetService.createClientAsset({
            clientId: clientId as any,
            productId: productId as any,
            assetTag: `EXPIRED-${Date.now()}`,
            status: 'active',
            warrantyStart,
            warrantyEnd
        });

        const expiredAssets = await clientAssetService.getExpiredWarranties();
        expect(expiredAssets.length).toBeGreaterThan(0);
    });

    test('should get client asset summary', async () => {
        // Create multiple assets
        for (let i = 0; i < 3; i++) {
            await clientAssetService.createClientAsset({
                clientId: clientId as any,
                productId: productId as any,
                assetTag: `SUMMARY-${Date.now()}-${i}`,
                status: 'active',
                warrantyStart: new Date(),
                warrantyEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            });
        }

        const summary = await clientAssetService.getClientAssetSummary(clientId);
        expect(summary).toBeDefined();
        expect(summary.clientId).toBe(clientId);
        expect(summary.totalAssets).toBeGreaterThan(0);
        expect(summary.activeAssets).toBeGreaterThan(0);
    });

    test('should retrieve asset by tag', async () => {
        const assetTag = `RETRIEVE-${Date.now()}`;
        const createdAsset = await clientAssetService.createClientAsset({
            clientId: clientId as any,
            productId: productId as any,
            assetTag,
            status: 'active',
            warrantyStart: new Date(),
            warrantyEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        });

        const retrievedAsset = await clientAssetService.getClientAssetByTag(assetTag);
        expect(retrievedAsset).toBeDefined();
        expect(retrievedAsset!.assetTag).toBe(assetTag);
    });
});
