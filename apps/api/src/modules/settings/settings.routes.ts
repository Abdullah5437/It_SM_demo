import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticate, requireRole } from '../../middlewares';

const router = Router();

// All settings routes require authentication and admin role
router.use(authenticate);
router.use(requireRole('admin'));

// Get pagination defaults (public within auth)
router.get('/pagination', settingsController.getPaginationDefaults.bind(settingsController));

// List all settings (optional ?group= filter)
router.get('/', settingsController.getAll.bind(settingsController));

// Get single setting by key
router.get('/:key', settingsController.getByKey.bind(settingsController));

// Create or update a setting
router.post('/', settingsController.upsert.bind(settingsController));

// Delete a setting
router.delete('/:key', settingsController.remove.bind(settingsController));

export const settingsRoutes = router;