import { Request, Response, NextFunction } from 'express';
import { serviceService } from './service.service';
import { ServiceCreateSchema, ServiceUpdateSchema } from '@i-itsm/shared';
import { logger } from '../../utils/logger';

export class ServiceController {
  /**
   * POST /api/v1/catalog/services
   * Create a new service
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ServiceCreateSchema.parse(req.body);
      const service = await serviceService.createService(validated);

      res.status(201).json({
        success: true,
        data: service,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/catalog/services/:id
   * Get a service by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const service = await serviceService.getServiceById(id);

      res.status(200).json({
        success: true,
        data: service,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/catalog/services/:id
   * Update a service
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = ServiceUpdateSchema.parse(req.body);
      const service = await serviceService.updateService(id, validated);

      res.status(200).json({
        success: true,
        data: service,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/catalog/services/:id
   * Delete a service
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await serviceService.deleteService(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/catalog/services
   * List services with filters
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { serviceGroupId, type, status, limit = '50', skip = '0' } = req.query;

      const result = await serviceService.listServices({
        serviceGroupId: serviceGroupId as string | undefined,
        type: type as string | undefined,
        status: status as string | undefined,
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

export const serviceController = new ServiceController();
