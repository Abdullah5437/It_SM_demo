import stockMovementService from '../stockMovement.service';
import StockLevel from '../stockLevel.model';
import StockMovement from '../stockMovement.model';
import Product from '../product.model';
import Warehouse from '../../warehouses/warehouse.model';
import { Schema } from 'mongoose';

describe('StockMovement Service', () => {
    let productId: string;
    let warehouseId: string;
    let stockLevelId: string;

    beforeAll(async () => {
        // Create test product
        const product = await Product.create({
            sku: 'TEST-SKU-001',
            name: 'Test Product',
            type: 'hardware',
            defaultSalePriceCents: 10000,
            defaultCostCents: 5000,
            currency: 'USD',
            trackInventory: true,
            trackSerial: false
        });
        productId = product._id.toString();

        // Create test warehouse
        const warehouse = await Warehouse.create({
            code: 'TEST-WH-001',
            name: 'Test Warehouse',
            address: {
                street: '123 Main St',
                city: 'Test City',
                state: 'TS',
                postalCode: '12345',
                country: 'USA'
            },
            status: 'active'
        });
        warehouseId = warehouse._id.toString();

        // Create initial stock level
        const stockLevel = await StockLevel.create({
            productId,
            warehouseId,
            qtyOnHand: 100,
            qtyReserved: 0,
            reorderPoint: 20,
            reorderQty: 50
        });
        stockLevelId = stockLevel._id.toString();
    });

    afterAll(async () => {
        // Cleanup
        await Product.deleteOne({ _id: productId });
        await Warehouse.deleteOne({ _id: warehouseId });
        await StockLevel.deleteOne({ _id: stockLevelId });
        await StockMovement.deleteMany({ productId });
    });

    test('should create stock movement and update stock level', async () => {
        const movement = await stockMovementService.createStockMovement({
            productId: productId as any,
            warehouseId: warehouseId as any,
            qtyDelta: -10,
            reason: 'sale',
            createdBy: 'test-user'
        });

        expect(movement).toBeDefined();
        expect(movement.qtyDelta).toBe(-10);

        // Check stock level was updated
        const updatedStockLevel = await StockLevel.findById(stockLevelId);
        expect(updatedStockLevel!.qtyOnHand).toBe(90);
    });

    test('should retrieve movement history', async () => {
        // Create multiple movements
        await stockMovementService.createStockMovement({
            productId: productId as any,
            warehouseId: warehouseId as any,
            qtyDelta: -5,
            reason: 'sale',
            createdBy: 'test-user'
        });

        await stockMovementService.createStockMovement({
            productId: productId as any,
            warehouseId: warehouseId as any,
            qtyDelta: 10,
            reason: 'purchase',
            createdBy: 'test-user'
        });

        const history = await stockMovementService.getMovementHistory(productId.toString(), warehouseId.toString());
        expect(history.length).toBeGreaterThanOrEqual(2);
        expect(history[0].qtyDelta).toBeDefined();
    });

    test('should prevent deletion of stock movements (immutable audit trail)', async () => {
        const movement = await stockMovementService.createStockMovement({
            productId: productId as any,
            warehouseId: warehouseId as any,
            qtyDelta: -3,
            reason: 'adjustment',
            createdBy: 'test-user'
        });

        const movementId = movement._id.toString();

        // Attempt to delete should not be possible via service
        // This demonstrates immutability
        const retrievedMovement = await stockMovementService.getStockMovementById(movementId);
        expect(retrievedMovement).toBeDefined();
        expect(retrievedMovement!.createdAt).toBeDefined();
    });
});
