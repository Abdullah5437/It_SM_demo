import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../../../main';
import Product from '../product.model';
import Warehouse from '../warehouse.model';
import StockLevel from '../stockLevel.model';
import SerializedItem from '../serializedItem.model';
import ClientAsset from '../clientAsset.model';
import { AuditLog } from '../../audit/audit.model';
import { ForbiddenError } from '@i-itsm/shared';

// Mock RBAC/auth to inject roles from headers while preserving actual validation logic
jest.mock('../../../middlewares', () => {
    const actual = jest.requireActual('../../../middlewares');
    return {
        ...actual,
        authenticate: (req: any, _res: any, next: any) => {
            const headerRoles = (req.headers['x-test-roles'] as string | undefined)?.split(',').map((r) => r.trim()).filter(Boolean) || ['admin'];
            req.user = { userId: 'test-user', email: 'test@example.com', roles: headerRoles };
            next();
        },
        requireRole: (...allowedRoles: string[]) => (req: any, _res: any, next: any) => {
            const headerRoles = (req.headers['x-test-roles'] as string | undefined)?.split(',').map((r) => r.trim()).filter(Boolean) || ['admin'];
            req.user = req.user || { userId: 'test-user', email: 'test@example.com', roles: headerRoles };
            const hasRole = req.user.roles.some((role: string) => allowedRoles.includes(role));
            if (!hasRole) {
                throw new ForbiddenError(`This action requires one of the following roles: ${allowedRoles.join(', ')}`);
            }
            next();
        },
    };
});

const app = createApp();
const adminHeaders = { 'x-test-roles': 'admin' };
const supportHeaders = { 'x-test-roles': 'support' };
const userHeaders = { 'x-test-roles': 'user' };

describe('Inventory endpoints integration', () => {
    let baseProductId: string;
    let baseWarehouseId: string;
    let stockLevelId: string;

    beforeAll(async () => {
        const sku = `BASE-PROD-${Date.now()}`;
        const productRes = await request(app)
            .post('/api/v1/inventory/products')
            .set(adminHeaders)
            .send({
                sku,
                name: 'Base Product',
                type: 'hardware',
                defaultSalePriceCents: 1000,
                defaultCostCents: 500,
                currency: 'USD',
                trackInventory: true,
                trackSerial: true,
                status: 'active',
                description: 'Base product for integration tests'
            });
        baseProductId = productRes.body._id;

        const warehouseRes = await request(app)
            .post('/api/v1/inventory/warehouses')
            .set(adminHeaders)
            .send({
                code: `WH-${Date.now()}`,
                name: 'Base Warehouse',
                address: {
                    street: '1 Test Way',
                    city: 'Testville',
                    state: 'TS',
                    postalCode: '12345',
                    country: 'USA'
                },
                status: 'active'
            });
        baseWarehouseId = warehouseRes.body._id;

        const stockLevel = await StockLevel.create({
            productId: new mongoose.Types.ObjectId(baseProductId),
            warehouseId: new mongoose.Types.ObjectId(baseWarehouseId),
            qtyOnHand: 25,
            qtyReserved: 0,
            reorderPoint: 5,
            reorderQty: 10,
        });
        stockLevelId = stockLevel._id.toString();
    });

    afterAll(async () => {
        await Product.deleteMany({ _id: baseProductId });
        await Warehouse.deleteMany({ _id: baseWarehouseId });
        await StockLevel.deleteMany({ _id: stockLevelId });
        await SerializedItem.deleteMany({});
        await ClientAsset.deleteMany({});
        await AuditLog.deleteMany({});
    });

    describe('Products', () => {
        it('rejects creation when role is missing', async () => {
            const res = await request(app)
                .post('/api/v1/inventory/products')
                .set(userHeaders)
                .send({ sku: `RBAC-${Date.now()}`, name: 'No Access Product' });
            expect(res.status).toBe(403);
            expect(res.body.code).toBe('FORBIDDEN');
        });

        it('enforces validation rules', async () => {
            const res = await request(app)
                .post('/api/v1/inventory/products')
                .set(adminHeaders)
                .send({ name: 'Invalid Product' });
            expect(res.status).toBe(400);
            expect(res.body.code).toBe('VALIDATION_ERROR');
        });

        it('supports CRUD lifecycle', async () => {
            const sku = `CRUD-${Date.now()}`;
            const createRes = await request(app)
                .post('/api/v1/inventory/products')
                .set(adminHeaders)
                .send({
                    sku,
                    name: 'CRUD Product',
                    type: 'hardware',
                    defaultSalePriceCents: 2000,
                    defaultCostCents: 1000,
                    currency: 'USD',
                    trackInventory: true,
                    trackSerial: false,
                    status: 'active'
                });
            expect(createRes.status).toBe(201);
            const productId = createRes.body._id;

            const getRes = await request(app).get(`/api/v1/inventory/products/${productId}`);
            expect(getRes.status).toBe(200);
            expect(getRes.body.sku).toBe(sku);

            const patchRes = await request(app)
                .patch(`/api/v1/inventory/products/${productId}`)
                .set(adminHeaders)
                .send({ name: 'Updated Name', status: 'inactive' });
            expect(patchRes.status).toBe(200);
            expect(patchRes.body.name).toBe('Updated Name');
            expect(patchRes.body.status).toBe('inactive');

            const listRes = await request(app).get('/api/v1/inventory/products?status=inactive');
            expect(listRes.status).toBe(200);
            expect(listRes.body.some((p: any) => p._id === productId)).toBe(true);

            const deleteRes = await request(app)
                .delete(`/api/v1/inventory/products/${productId}`)
                .set(adminHeaders);
            expect(deleteRes.status).toBe(200);
            const deletedGet = await request(app).get(`/api/v1/inventory/products/${productId}`);
            expect(deletedGet.status).toBe(404);
        });
    });

    describe('Warehouses', () => {
        it('requires appropriate role', async () => {
            const res = await request(app)
                .post('/api/v1/inventory/warehouses')
                .set(userHeaders)
                .send({
                    code: `RBAC-WH-${Date.now()}`,
                    name: 'No Role Warehouse',
                    address: { street: '1', city: 'c', state: 's', postalCode: 'p', country: 'c' },
                    status: 'active'
                });
            expect(res.status).toBe(403);
            expect(res.body.code).toBe('FORBIDDEN');
        });

        it('validates payloads', async () => {
            const res = await request(app)
                .post('/api/v1/inventory/warehouses')
                .set(adminHeaders)
                .send({ name: 'Missing code warehouse' });
            expect(res.status).toBe(400);
            expect(res.body.code).toBe('VALIDATION_ERROR');
        });

        it('supports creation and updates', async () => {
            const code = `WH-${Date.now()}`;
            const createRes = await request(app)
                .post('/api/v1/inventory/warehouses')
                .set(adminHeaders)
                .send({
                    code,
                    name: 'Integration Warehouse',
                    address: { street: '2 Test', city: 'Town', state: 'ST', postalCode: '99999', country: 'USA' },
                    status: 'active'
                });
            expect(createRes.status).toBe(201);
            const id = createRes.body._id;

            const getRes = await request(app).get(`/api/v1/inventory/warehouses/${id}`);
            expect(getRes.status).toBe(200);

            const patchRes = await request(app)
                .patch(`/api/v1/inventory/warehouses/${id}`)
                .set(supportHeaders)
                .send({ name: 'Updated Warehouse', status: 'inactive' });
            expect(patchRes.status).toBe(200);
            expect(patchRes.body.name).toBe('Updated Warehouse');
            expect(patchRes.body.status).toBe('inactive');
        });
    });

    describe('Stock levels', () => {
        it('rejects unauthorized updates', async () => {
            const res = await request(app)
                .patch(`/api/v1/inventory/stock-levels/${stockLevelId}`)
                .set(userHeaders)
                .send({ qtyOnHand: 10 });
            expect(res.status).toBe(403);
            expect(res.body.code).toBe('FORBIDDEN');
        });

        it('validates update payloads', async () => {
            const res = await request(app)
                .patch(`/api/v1/inventory/stock-levels/${stockLevelId}`)
                .set(adminHeaders)
                .send({ qtyOnHand: -5 });
            expect(res.status).toBe(400);
            expect(res.body.code).toBe('VALIDATION_ERROR');
        });

        it('allows reading and updating stock levels', async () => {
            const getRes = await request(app).get(`/api/v1/inventory/stock-levels/${stockLevelId}`);
            expect(getRes.status).toBe(200);
            expect(getRes.body.qtyOnHand).toBeDefined();

            const patchRes = await request(app)
                .patch(`/api/v1/inventory/stock-levels/${stockLevelId}`)
                .set(adminHeaders)
                .send({ qtyOnHand: 30, reorderPoint: 8 });
            expect(patchRes.status).toBe(200);
            expect(patchRes.body.qtyOnHand).toBe(30);
            expect(patchRes.body.reorderPoint).toBe(8);

            const listRes = await request(app).get('/api/v1/inventory/stock-levels');
            expect(listRes.status).toBe(200);
            expect(Array.isArray(listRes.body)).toBe(true);
        });
    });

    describe('Serialized items', () => {
        it('enforces RBAC for creation', async () => {
            const res = await request(app)
                .post('/api/v1/inventory/serialized-items')
                .set(userHeaders)
                .send({ serialNo: 'NO-ROLE', productId: baseProductId, warehouseId: baseWarehouseId });
            expect(res.status).toBe(403);
            expect(res.body.code).toBe('FORBIDDEN');
        });

        it('validates create payloads', async () => {
            const res = await request(app)
                .post('/api/v1/inventory/serialized-items')
                .set(adminHeaders)
                .send({ serialNo: '' });
            expect(res.status).toBe(400);
            expect(res.body.code).toBe('VALIDATION_ERROR');
        });

        it('supports create, read, and update', async () => {
            const serialNo = `SN-${Date.now()}`;
            const createRes = await request(app)
                .post('/api/v1/inventory/serialized-items')
                .set(adminHeaders)
                .send({ serialNo, productId: baseProductId, warehouseId: baseWarehouseId });
            expect(createRes.status).toBe(201);
            const serializedItemId = createRes.body._id;

            const getRes = await request(app).get(`/api/v1/inventory/serialized-items/${serializedItemId}`);
            expect(getRes.status).toBe(200);
            expect(getRes.body.serialNo).toBe(serialNo);

            const patchRes = await request(app)
                .patch(`/api/v1/inventory/serialized-items/${serializedItemId}`)
                .set(supportHeaders)
                .send({ status: 'returned', warehouseId: baseWarehouseId });
            expect(patchRes.status).toBe(200);
            expect(patchRes.body.status).toBe('returned');
        });
    });

    describe('Client assets', () => {
        it('requires admin/support roles for creation', async () => {
            const res = await request(app)
                .post('/api/v1/inventory/client-assets')
                .set(userHeaders)
                .send({
                    clientId: '507f1f77bcf86cd799439011',
                    productId: baseProductId,
                    assetTag: `ASSET-RBAC-${Date.now()}`,
                    warrantyStart: new Date().toISOString(),
                    warrantyEnd: new Date(Date.now() + 86400000).toISOString()
                });
            expect(res.status).toBe(403);
            expect(res.body.code).toBe('FORBIDDEN');
        });

        it('validates creation payloads', async () => {
            const res = await request(app)
                .post('/api/v1/inventory/client-assets')
                .set(adminHeaders)
                .send({ clientId: '507f1f77bcf86cd799439011', productId: baseProductId });
            expect(res.status).toBe(400);
            expect(res.body.code).toBe('VALIDATION_ERROR');
        });

        it('supports lifecycle actions with audit logging', async () => {
            const serialItem = await SerializedItem.create({
                serialNo: `ASSET-SN-${Date.now()}`,
                productId: baseProductId,
                warehouseId: baseWarehouseId,
                status: 'in_stock'
            });

            const createRes = await request(app)
                .post('/api/v1/inventory/client-assets')
                .set(supportHeaders)
                .send({
                    clientId: '507f1f77bcf86cd799439011',
                    productId: baseProductId,
                    serializedItemId: serialItem._id.toString(),
                    assetTag: `ASSET-${Date.now()}`,
                    warrantyStart: new Date().toISOString(),
                    warrantyEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                });
            expect(createRes.status).toBe(201);
            const assetId = createRes.body._id;

            const retireForbidden = await request(app)
                .post(`/api/v1/inventory/client-assets/${assetId}/retire`)
                .set(supportHeaders);
            expect(retireForbidden.status).toBe(403);
            expect(retireForbidden.body.code).toBe('FORBIDDEN');

            const retireRes = await request(app)
                .post(`/api/v1/inventory/client-assets/${assetId}/retire`)
                .set(adminHeaders);
            expect(retireRes.status).toBe(200);
            expect(retireRes.body.status).toBe('retired');

            const auditEntries = await AuditLog.find({ entityType: 'ClientAsset', entityId: assetId });
            expect(auditEntries.length).toBeGreaterThan(0);

            const returnRes = await request(app)
                .post(`/api/v1/inventory/client-assets/${assetId}/return`)
                .set(supportHeaders)
                .send({ warehouseId: baseWarehouseId });
            expect(returnRes.status).toBe(200);
            expect(returnRes.body.status).toBe('returned');
        });
    });
});
