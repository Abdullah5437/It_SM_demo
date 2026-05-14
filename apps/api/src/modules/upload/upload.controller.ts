import { Request, Response } from 'express';
import cloudinary from '../../config/cloudinary';

export class UploadController {
  async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file provided' });
        return;
      }

      // Convert buffer to base64 for Cloudinary upload
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'i-itsm/products',
        resource_type: 'image',
      });

      res.json({
        success: true,
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    }
  }
}

export default new UploadController();