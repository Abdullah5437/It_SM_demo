import Category, { ICategory } from './category.model';
import { logger } from '../../utils/logger';

export class CategoryService {
  async createCategory(data: Partial<ICategory>): Promise<ICategory> {
    const category = new Category(data);
    const saved = await category.save();
    logger.info({ action: 'create', entity: 'Category', id: saved._id, name: saved.name }, 'Category created');
    return saved;
  }

  async getCategoryById(id: string): Promise<ICategory | null> {
    return Category.findById(id);
  }

async listCategories(filters: any = {}): Promise<ICategory[]> {
  return Category.find(filters).sort({ name: 1 });
}

async updateCategory(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
  const updated = await Category.findByIdAndUpdate(
    id,
    { ...data, updatedAt: new Date() },
    { new: true, runValidators: true }
  );

  if (updated) {
    logger.info({ action: 'update', entity: 'Category', id, name: updated.name }, 'Category updated');
  }

  return updated;
}

async deleteCategory(id: string): Promise<ICategory | null> {
  const deleted = await Category.findByIdAndDelete(id);

  if (deleted) {
    logger.info({ action: 'delete', entity: 'Category', id, name: deleted.name }, 'Category deleted');
  }

  return deleted;
}

  // Subcategory helpers
  async addSubcategory(categoryId: string, subcategory: { name: string; description?: string }): Promise<ICategory | null> {
    const category = await Category.findById(categoryId);
    if (!category) return null;
    category.subcategories.push({ ...subcategory, subSubcategories: [] });
    category.updatedAt = new Date();
    return (await category.save()).toObject();
  }

  async updateSubcategory(categoryId: string, subcategoryName: string, data: { name?: string; description?: string }): Promise<ICategory | null> {
    const category = await Category.findById(categoryId);
    if (!category) return null;
    const subcat = category.subcategories.find(s => s.name === subcategoryName);
    if (!subcat) return null;
    if (data.name !== undefined) subcat.name = data.name;
    if (data.description !== undefined) subcat.description = data.description;
    category.updatedAt = new Date();
    return (await category.save()).toObject();
  }

  async removeSubcategory(categoryId: string, subcategoryName: string): Promise<ICategory | null> {
    const category = await Category.findById(categoryId);
    if (!category) return null;
    category.subcategories = category.subcategories.filter(s => s.name !== subcategoryName);
    category.updatedAt = new Date();
    return (await category.save()).toObject();
  }

  // Sub-subcategory helpers
  async addSubSubcategory(categoryId: string, subcategoryName: string, subsub: { name: string; description?: string }): Promise<ICategory | null> {
    const category = await Category.findById(categoryId);
    if (!category) return null;
    const subcat = category.subcategories.find(s => s.name === subcategoryName);
    if (!subcat) return null;
    subcat.subSubcategories.push(subsub);
    category.updatedAt = new Date();
    return (await category.save()).toObject();
  }

  async updateSubSubcategory(categoryId: string, subcategoryName: string, subsubName: string, data: { name?: string; description?: string }): Promise<ICategory | null> {
    const category = await Category.findById(categoryId);
    if (!category) return null;
    const subcat = category.subcategories.find(s => s.name === subcategoryName);
    if (!subcat) return null;
    const subsub = subcat.subSubcategories.find(s => s.name === subsubName);
    if (!subsub) return null;
    if (data.name !== undefined) subsub.name = data.name;
    if (data.description !== undefined) subsub.description = data.description;
    category.updatedAt = new Date();
    return (await category.save()).toObject();
  }

  async removeSubSubcategory(categoryId: string, subcategoryName: string, subsubName: string): Promise<ICategory | null> {
    const category = await Category.findById(categoryId);
    if (!category) return null;
    const subcat = category.subcategories.find(s => s.name === subcategoryName);
    if (!subcat) return null;
    subcat.subSubcategories = subcat.subSubcategories.filter(s => s.name !== subsubName);
    category.updatedAt = new Date();
    return (await category.save()).toObject();
  }
}

export default new CategoryService();