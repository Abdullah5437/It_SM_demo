import { Request, Response, NextFunction } from 'express';
import { serviceGroupService } from './serviceGroup.service';
import { ServiceGroupCreateSchema, ServiceGroupUpdateSchema } from '@i-itsm/shared';
import { logger } from '../../utils/logger';

export class ServiceGroupController {
  /**
   * POST /api/v1/catalog/service-groups
   * Create a new service group
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ServiceGroupCreateSchema.parse(req.body);
      const serviceGroup = await serviceGroupService.createServiceGroup(validated);

      res.status(201).json({
        success: true,
        data: serviceGroup,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/catalog/service-groups/:id
   * Get a service group by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const serviceGroup = await serviceGroupService.getServiceGroupById(id);

      res.status(200).json({
        success: true,
        data: serviceGroup,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/catalog/service-groups/:id
   * Update a service group
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = ServiceGroupUpdateSchema.parse(req.body);
      const serviceGroup = await serviceGroupService.updateServiceGroup(id, validated);

      res.status(200).json({
        success: true,
        data: serviceGroup,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/catalog/service-groups/:id
   * Delete a service group
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await serviceGroupService.deleteServiceGroup(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/catalog/service-groups
   * List all service groups
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = '50', skip = '0' } = req.query;

      const result = await serviceGroupService.listServiceGroups({
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

export const serviceGroupController = new ServiceGroupController();
