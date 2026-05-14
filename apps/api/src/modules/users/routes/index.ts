import { Router, Request, Response, NextFunction } from 'express';
import { createUserSchema, userUpdateSchema } from '../schemas';
import { requireRole, validateRequest, validateSignupKey ,authenticate} from '../../../middlewares';
import usersController from '../users.controller';

const router = Router();

/**
 * Create a new user (admin only)
 * POST /api/v1/users
 */
router.post(
  '/',
//   authenticate,
validateSignupKey,
//   requireRole('admin'),
  validateRequest(createUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    await usersController.createUser(req, res, next);
  }
);

/**
 * List all users (admin and accounts roles)
 * GET /api/v1/users
 */
router.get(
  '/',
  // authenticate,
  // requireRole('admin', 'accounts'),
  async (req: Request, res: Response, next: NextFunction) => {
    await usersController.listUsers(req, res, next);
  }
);

/**
 * Get user by ID (admin or own profile)
 * GET /api/v1/users/:id
 */
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    // Check if user is admin or requesting their own profile
    if (req.user!.roles.includes('admin') || req.user!.userId === req.params.id) {
      await usersController.getUser(req, res, next);
    } else {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
      });
    }
  }
);

/**
 * Update user (admin only)
 * PATCH /api/v1/users/:id
 */
router.patch(
  '/:id',
  authenticate,
  // requireRole('admin'),
  validateRequest(userUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    await usersController.updateUser(req, res, next);
  }
);

/**
 * Delete user (admin only)
 * DELETE /api/v1/users/:id
 */
router.delete(
  '/:id',
  authenticate,
  // requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    await usersController.deleteUser(req, res, next);
  }
);

/**
 * Change user status (admin only)
 * PATCH /api/v1/users/:id/status
 */
router.patch(
  '/:id/status',
  authenticate,
  // requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    await usersController.changeUserStatus(req, res, next);
  }
);

export default router;