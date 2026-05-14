import { Request, Response, NextFunction } from 'express';
import { serviceAddonService } from './serviceAddon.service';
import { ServiceAddonCreateSchema, ServiceAddonUpdateSchema } from '@i-itsm/shared';
import { logger } from '../../utils/logger';

export class ServiceAddonController {
  /**
   * POST /api/v1/catalog/service-addons
   * Create a new service addon
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ServiceAddonCreateSchema.parse(req.body);
      const serviceAddon = await serviceAddonService.createServiceAddon(validated);

      res.status(201).json({
        success: true,
        data: serviceAddon,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/catalog/service-addons/:id
   * Get a service addon by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const serviceAddon = await serviceAddonService.getServiceAddonById(id);

      res.status(200).json({
        success: true,
        data: serviceAddon,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/catalog/service-addons/:id
   * Update a service addon
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = ServiceAddonUpdateSchema.parse(req.body);
      const serviceAddon = await serviceAddonService.updateServiceAddon(id, validated);

      res.status(200).json({
        success: true,
        data: serviceAddon,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/catalog/service-addons/:id
   * Delete a service addon
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await serviceAddonService.deleteServiceAddon(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/catalog/service-addons
   * List service addons with filters
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { serviceId, limit = '50', skip = '0' } = req.query;

      const result = await serviceAddonService.listServiceAddons({
        serviceId: serviceId as string | undefined,
        limit: parseInt(limit as string),
        skip: parseInt(skip as string),
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          limit: parseInt(limit as string),
          skip: parseInt(skip as string),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const serviceAddonController = new ServiceAddonController();
