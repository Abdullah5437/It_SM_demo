import { Request, Response, NextFunction } from 'express';
import categoryService from './category.service';

export class CategoryController {
  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.createCategory(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async getCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      if (!category) {
        res.status(404).json({ success: false, error: 'Category not found' });
        return;
      }
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: any = {};
      if (req.query.type) filters.type = req.query.type;
      const categories = await categoryService.listCategories(filters);
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);
      if (!category) {
        res.status(404).json({ success: false, error: 'Category not found' });
        return;
      }
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.deleteCategory(req.params.id);
      if (!category) {
        res.status(404).json({ success: false, error: 'Category not found' });
        return;
      }
      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Subcategory operations
  async addSubcategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.addSubcategory(req.params.id, req.body);
      if (!category) {
        res.status(404).json({ success: false, error: 'Category not found' });
        return;
      }
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async updateSubcategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.updateSubcategory(req.params.id, req.params.subcategoryName, req.body);
      if (!category) {
        res.status(404).json({ success: false, error: 'Category or subcategory not found' });
        return;
      }
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async removeSubcategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.removeSubcategory(req.params.id, req.params.subcategoryName);
      if (!category) {
        res.status(404).json({ success: false, error: 'Category not found' });
        return;
      }
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  // Sub-subcategory operations
  async addSubSubcategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.addSubSubcategory(req.params.id, req.params.subcategoryName, req.body);
      if (!category) {
        res.status(404).json({ success: false, error: 'Category or subcategory not found' });
        return;
      }
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async updateSubSubcategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.updateSubSubcategory(req.params.id, req.params.subcategoryName, req.params.subsubName, req.body);
      if (!category) {
        res.status(404).json({ success: false, error: 'Category, subcategory or sub-subcategory not found' });
        return;
      }
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async removeSubSubcategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.removeSubSubcategory(req.params.id, req.params.subcategoryName, req.params.subsubName);
      if (!category) {
        res.status(404).json({ success: false, error: 'Category or subcategory not found' });
        return;
      }
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();