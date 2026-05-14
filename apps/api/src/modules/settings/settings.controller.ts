import { Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service';

export class SettingsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { group } = req.query;
      const settings = await settingsService.getAllSettings(group as string | undefined);
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  async getByKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;
      const value = await settingsService.getSetting(key);
      if (value === null) {
        res.status(404).json({ success: false, error: 'Setting not found' });
        return;
      }
      res.json({ success: true, data: { key, value } });
    } catch (error) {
      next(error);
    }
  }

  async upsert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key, value, group, description } = req.body;
      if (!key || value === undefined) {
        res.status(400).json({ success: false, error: 'Key and value are required' });
        return;
      }
      await settingsService.setSetting(key, String(value), group || 'general', description || '');
      res.json({ success: true, message: 'Setting saved successfully' });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;
      await settingsService.deleteSetting(key);
      res.json({ success: true, message: 'Setting deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getPaginationDefaults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = await settingsService.getPaginationDefaults();
      res.json({ success: true, data: pagination });
    } catch (error) {
      next(error);
    }
  }
}

export const settingsController = new SettingsController();