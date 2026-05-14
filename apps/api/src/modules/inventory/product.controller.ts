import { Request, Response, NextFunction } from 'express';
import productService from './product.service';

export class ProductController {
    // Create product
    async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const product = await productService.createProduct(req.body);
            res.status(201).json({
                success: true,
                data: product
            });
        } catch (error) {
            next(error);
        }
    }

    // Get product by ID
    async getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const product = await productService.getProductById(req.params.id);
            if (!product) {
                res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
                return;
            }
            res.json({
                success: true,
                data: product
            });
        } catch (error) {
            next(error);
        }
    }

    // List products
    async listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { skip = 0, limit = 10, ...filters } = req.query;
            const skipNum = parseInt(skip as string, 10) || 0;
            const limitNum = parseInt(limit as string, 10) || 10;

            const products = await productService.listProducts(filters, skipNum, limitNum);
            const total = await productService.countProducts(filters);

            res.json({
                success: true,
                data: products,
                pagination: {
                    skip: skipNum,
                    limit: limitNum,
                    total
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Update product
    async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const product = await productService.updateProduct(req.params.id, req.body);
            if (!product) {
                res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
                return;
            }
            res.json({
                success: true,
                data: product
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete product
    async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const product = await productService.deleteProduct(req.params.id);
            if (!product) {
                res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Product deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new ProductController();
