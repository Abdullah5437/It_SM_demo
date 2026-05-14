import { Router } from 'express';
import productRoutes from './product.routes';
import warehouseRoutes from './warehouse.routes';
import stockLevelRoutes from './stockLevel.routes';
import stockMovementRoutes from './stockMovement.routes';
import serializedItemRoutes from './serializedItem.routes';
import clientAssetRoutes from './clientAsset.routes';
import stockAllocationRoutes from './stockAllocation.routes';
import lowStockAlertRoutes from './lowStockAlert.routes';
import { auditLogger } from '../../middlewares';

const router = Router();

// Audit logging for all inventory mutations
router.use(auditLogger);

// Inventory routes
router.use('/products', productRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/stock-levels', stockLevelRoutes);
router.use('/stock-movements', stockMovementRoutes);
router.use('/serialized-items', serializedItemRoutes);
router.use('/client-assets', clientAssetRoutes);
router.use('/stock-allocations', stockAllocationRoutes);
router.use('/low-stock', lowStockAlertRoutes);

export default router;