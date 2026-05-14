import { Router, Request, Response } from 'express';
import upload from '../../middlewares/upload';
import uploadController from './upload.controller';

const router = Router();

// Upload product image
router.post('/image', upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  await uploadController.uploadImage(req, res);
});

export default router;