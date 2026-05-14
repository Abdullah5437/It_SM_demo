import stockAllocationService from '../stockAllocation.service';
import StockLevel from '../stockLevel.model';
import StockMovement from '../stockMovement.model';
import SerializedItem from '../serializedItem.model';
import ClientAsset from '../clientAsset.model';
import Product from '../product.model';
import Warehouse from '../../warehouses/warehouse.model';
import { Schema } from 'mongoose';

describe('Stock Allocation Service', () => {
    let productId: string;
    let warehouseId: string;
    let clientId: string = '507f1f77bcf86cd799439011';
    let serialItemId: string;

    beforeAll(async () => {
        // Create test product
        const product = await Product.create({
            sku: 'ALLOC-TEST-001',
            name: 'Allocatable Product',
            type: 'hardware',
            defaultSalePriceCents: 50000,
            defaultCostCents: 25000,
            currency: 'USD',
            trackInventory: true,
            trackSerial: true
        });
        productId = product._id.toString();

        // Create test warehouse
        const warehouse = await Warehouse.create({
            code: 'ALLOC-WH-001',
            name: 'Allocation Warehouse',
            address: {
                street: '456 Oak St',
                city: 'Alloc City',
                state: 'AL',
                postalCode: '54321',
                country: 'USA'
            },
            status: 'active'
        });
        warehouseId = warehouse._id.toString();

        // Create stock level with inventory
        await StockLevel.create({
            productId,
            warehouseId,
            qtyOnHand: 50,
            qtyReserved: 0,
            reorderPoint: 10,
            reorderQty: 25
        });

        // Create serialized item
        const serialItem = await SerializedItem.create({
            serialNo: `SN-${Date.now()}`,
            productId,
            warehouseId,
            status: 'in_stock'
        });
        serialItemId = serialItem._id.toString();
    });

    afterAll(async () => {
        // Cleanup
        await Product.deleteOne({ _id: productId });
        await Warehouse.deleteOne({ _id: warehouseId });
        await StockLevel.deleteMany({ productId });
        await StockMovement.deleteMany({ productId });
        await SerializedItem.deleteMany({ _id: serialItemId });
        await ClientAsset.deleteMany({ productId });
    });

    test('should allocate stock for invoice with sufficient inventory', async () => {
        const invoiceId = `INV-${Date.now()}`;
        const result = await stockAllocationService.allocateStockForInvoice(
            invoiceId,
            [
                {
                    productId: productId.toString(),
                    quantity: 5,
                    warehouseId: warehouseId.toString(),
                    serializedItemIds: [serialItemId.toString()]
                }
            ],
            clientId,
            undefined,
            'test-user'
        );

        expect(result.success).toBe(true);
        expect(result.allocations[0].quantityAllocated).toBe(5);

        // Verify stock level was updated
        const stockLevel = await StockLevel.findOne({ productId });
        expect(stockLevel!.qtyOnHand).toBe(45);
        expect(stockLevel!.qtyReserved).toBe(5);
    });

    test('should fail allocation when insufficient stock', async () => {
        const invoiceId = `INV-FAIL-${Date.now()}`;
        const result = await stockAllocationService.allocateStockForInvoice(
            invoiceId,
            [
                {
                    productId: productId.toString(),
                    quantity: 1000, // More than available
                    warehouseId: warehouseId.toString()
                }
            ],
            clientId,
            undefined,
            'test-user'
        );

        expect(result.success).toBe(false);
        expect(result.allocations[0].error).toBeDefined();
    });

    test('should create stock movement with invoice reference', async () => {
        const invoiceId = `INV-MOVE-${Date.now()}`;
        await stockAllocationService.allocateStockForInvoice(
            invoiceId,
            [
                {
                    productId: productId.toString(),
                    quantity: 3,
                    warehouseId: warehouseId.toString()
                }
            ],
            clientId,
            undefined,
            'test-user'
        );

        const movement = await StockMovement.findOne({
            'ref.id': invoiceId,
            'ref.type': 'Invoice'
        });

        expect(movement).toBeDefined();
        expect(movement!.reason).toBe('sale');
        expect(movement!.qtyDelta).toBe(-3);
    });

    test('should create client assets for allocated stock', async () => {
        const invoiceId = `INV-ASSET-${Date.now()}`;
        const result = await stockAllocationService.allocateStockForInvoice(
            invoiceId,
            [
                {
                    productId: productId.toString(),
                    quantity: 2,
                    warehouseId: warehouseId.toString()
                }
            ],
            clientId,
            undefined,
            'test-user'
        );

        expect(result.clientAssets).toBeDefined();
        expect(result.clientAssets!.length).toBeGreaterThan(0);

        const asset = await ClientAsset.findById(result.clientAssets![0]);
        expect(asset).toBeDefined();
        expect(asset!.status).toBe('active');
        expect(asset!.purchase?.invoiceId).toBeDefined();
    });

    test('should reserve stock without creating assets', async () => {
        const orderId = `ORD-${Date.now()}`;
        const result = await stockAllocationService.reserveStock(
            productId.toString(),
            10,
            orderId,
            'test-user'
        );

        expect(result).toBe(true);

        const stockLevel = await StockLevel.findOne({ productId });
        expect(stockLevel!.qtyReserved).toBeGreaterThanOrEqual(10);
    });

    test('should release reserved stock', async () => {
        const stockLevelBefore = await StockLevel.findOne({ productId });
        const reservedBefore = stockLevelBefore!.qtyReserved;

        const result = await stockAllocationService.releaseReservedStock(
            productId.toString(),
            5,
            'Order cancelled',
            'test-user'
        );

        expect(result).toBe(true);

        const stockLevelAfter = await StockLevel.findOne({ productId });
        expect(stockLevelAfter!.qtyReserved).toBeLessThan(reservedBefore);
    });
});
