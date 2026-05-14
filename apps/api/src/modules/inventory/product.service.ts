import Product, { IProduct } from './product.model';
import { logger } from '../../utils/logger';

export class ProductService {
    // Create product
    async createProduct(data: Partial<IProduct>): Promise<IProduct> {
        // If category is provided as an ObjectId string, try to resolve the category name
        if (data.category) {
            const Category = (await import('../categories/category.model')).default;
            const cat = await Category.findById(data.category).lean();
            if (cat) {
                data.categoryId = cat._id as any;
                // If category field still has the ID, replace with name
                if (data.category && typeof data.category === 'string' && data.category.length === 24) {
                    data.category = cat.name;
                }
            }
        }
        const product = new Product(data);
        const saved = await product.save();
        logger.info({ action: 'create', entity: 'Product', id: saved._id, sku: saved.sku }, 'Product created');
        return saved;
    }

    // Get product by ID
    async getProductById(id: string): Promise<any> {
        return Product.findById(id).populate('categoryId', 'name type').lean();
    }

    // Get product by SKU
    async getProductBySku(sku: string): Promise<any> {
        return Product.findOne({ sku }).populate('categoryId', 'name type').lean();
    }

    // List products with filters and pagination
    async listProducts(filters: any = {}, skip: number = 0, limit: number = 10): Promise<any[]> {
        const { skip: _, limit: __, ...mongoFilters } = filters;
        return Product.find(mongoFilters)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .populate('categoryId', 'name type')
            .lean();
    }

    // Update product
    async updateProduct(id: string, data: Partial<IProduct>): Promise<any | null> {
        // If category is provided as an ObjectId string, resolve the category name
        if (data.category) {
            try {
                const Category = (await import('../categories/category.model')).default;
                const cat = await Category.findById(data.category).lean();
                if (cat) {
                    data.categoryId = cat._id as any;
                    if (data.category && typeof data.category === 'string' && data.category.length === 24) {
                        data.category = cat.name;
                    }
                }
            } catch {
                // If not a valid ObjectId, keep as-is (already a name)
            }
        }
        const updated = await Product.findByIdAndUpdate(
            id, 
            { ...data, updatedAt: new Date() }, 
            { new: true, runValidators: true }
        ).populate('categoryId', 'name type').lean();
        if (updated) {
            logger.info({ action: 'update', entity: 'Product', id, sku: updated.sku }, 'Product updated');
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
