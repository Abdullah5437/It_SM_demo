import { Router } from 'express';
import categoryRoutes from './category.routes';
import { auditLogger } from '../../middlewares';

const router = Router();

router.use(auditLogger);
router.use('/categories', categoryRoutes);

export default router;