import Product, { IProduct } from './product.model';
import { logger } from '../../utils/logger';

export class ProductService {
    /**
     * Auto-generate the next sequential SKU
     * Format: PROD_YYXXX where YY = last 2 digits of current year, XXX = zero-padded sequential
     * Example: PROD_26001, PROD_26002, ...
     */
    async generateSku(): Promise<string> {
        const now = new Date();
        const year = String(now.getFullYear()).slice(-2); // "26" for 2026
        const prefix = `PROD_${year}`;

        // Find the highest existing SKU with this year's prefix
        const lastProduct = await Product.findOne({
            sku: { $regex: `^${prefix}` }
        })
            .sort({ sku: -1 })
            .select('sku')
            .lean();

        let nextSeq = 1;
        if (lastProduct) {
            const lastSeq = parseInt(lastProduct.sku.replace(prefix, ''), 10);
            if (!isNaN(lastSeq)) {
                nextSeq = lastSeq + 1;
            }
        }

        const sku = `${prefix}${String(nextSeq).padStart(3, '0')}`;
        return sku;
    }

    // Create product
    async createProduct(data: Partial<IProduct>): Promise<any> {
        // Auto-generate SKU if not provided
        if (!data.sku) {
            data.sku = await this.generateSku();
        }
        console.log('[DEBUG] createProduct input sizes:', JSON.stringify((data as any).sizes));
        const product = new Product(data);
        console.log('[DEBUG] product instance sizes before save:', JSON.stringify(product.sizes));
        const saved = await product.save();
        console.log('[DEBUG] saved product sizes:', JSON.stringify(saved.sizes));
        const obj = saved.toObject();
        console.log('[DEBUG] toObject sizes:', JSON.stringify((obj as any).sizes));
        console.log('[DEBUG] Product created with sizes count:', (obj.sizes || []).length);
        logger.info({ action: 'create', entity: 'Product', id: saved._id, sku: saved.sku }, 'Product created');
        return obj;
    }

    // Get product by ID
    async getProductById(id: string): Promise<any> {
        const product = await Product.findById(id).lean();
        if (product) {
            return { ...product, sizes: (product as any).sizes || [] };
        }
        return product;
    }

    // Get product by SKU
    async getProductBySku(sku: string): Promise<any> {
        return Product.findOne({ sku }).lean();
    }

    // List products with filters and pagination
    async listProducts(filters: any = {}, skip: number = 0, limit: number = 10): Promise<any[]> {
        const { skip: _, limit: __, ...mongoFilters } = filters;
        const products = await Product.find(mongoFilters)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();
        return products.map(p => ({ ...p, sizes: (p as any).sizes || [] }));
    }

    // Update product
    async updateProduct(id: string, data: Partial<IProduct>): Promise<any | null> {
        const updated = await Product.findByIdAndUpdate(
            id, 
            { ...data, updatedAt: new Date() }, 
            { new: true, runValidators: true }
        ).lean();
        if (updated) {
            logger.info({ action: 'update', entity: 'Product', id, sku: updated.sku }, 'Product updated');
            return { ...updated, sizes: (updated as any).sizes || [] };
        }
        return updated;
    }

    // Delete product
    async deleteProduct(id: string): Promise<any> {
        const deleted = await Product.findByIdAndDelete(id).lean();
        if (deleted) {
            logger.info({ action: 'delete', entity: 'Product', id, sku: (deleted as any).sku }, 'Product deleted');
        }
        return deleted;
    }

    // Count products
    async countProducts(filters: any = {}): Promise<number> {
        const { skip, limit, ...mongoFilters } = filters;
        return Product.countDocuments(mongoFilters);
    }
}

export default new ProductService();