import { Router, Request, Response, NextFunction } from 'express';
import { productCreateSchema, productUpdateSchema } from '@i-itsm/shared';
import { requireRole, validateRequest } from '../../middlewares';
import productController from './product.controller';

const router = Router();
// requireRole('admin', 'sales')
// Create product (admin or sales)
router.post('/', validateRequest(productCreateSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await productController.createProduct(req, res, next);
});

// List products
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await productController.listProducts(req, res, next);
});

// Get product by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await productController.getProduct(req, res, next);
});

// Update product (admin or sales)
router.patch('/:id', validateRequest(productUpdateSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await productController.updateProduct(req, res, next);
});

// Delete product (admin only)
router.delete('/:id',  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await productController.deleteProduct(req, res, next);
});

export default router;