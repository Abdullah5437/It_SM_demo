import { Router, Request, Response, NextFunction } from 'express';
import { categoryCreateSchema, categoryUpdateSchema } from '@i-itsm/shared';
import { requireRole, validateRequest } from '../../middlewares';
import categoryController from './category.controller';

const router = Router();
// requireRole('admin'); // All routes require admin role for now, can be adjusted as needed
// Create category (admin only)
router.post('/', validateRequest(categoryCreateSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await categoryController.createCategory(req, res, next);
});

// List categories
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await categoryController.listCategories(req, res, next);
});

// Get category by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await categoryController.getCategory(req, res, next);
});

// Update category (admin only)
router.patch('/:id', validateRequest(categoryUpdateSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await categoryController.updateCategory(req, res, next);
});

// Delete category (admin only)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await categoryController.deleteCategory(req, res, next);
});

// ------ Subcategory operations ------

// Add subcategory to category
router.post('/:id/subcategories', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await categoryController.addSubcategory(req, res, next);
});

// Update subcategory
router.patch('/:id/subcategories/:subcategoryName', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await categoryController.updateSubcategory(req, res, next);
});

// Remove subcategory from category
router.delete('/:id/subcategories/:subcategoryName', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await categoryController.removeSubcategory(req, res, next);
});

// ------ Sub-subcategory operations ------

// Add sub-subcategory to a subcategory
router.post('/:id/subcategories/:subcategoryName/subsubcategories', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await categoryController.addSubSubcategory(req, res, next);
});

// Update sub-subcategory
router.patch('/:id/subcategories/:subcategoryName/subsubcategories/:subsubName', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await categoryController.updateSubSubcategory(req, res, next);
});

// Remove sub-subcategory from a subcategory
router.delete('/:id/subcategories/:subcategoryName/subsubcategories/:subsubName',  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await categoryController.removeSubSubcategory(req, res, next);
});

export default router;