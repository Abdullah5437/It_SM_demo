import { Request, Response, NextFunction } from 'express';
import { servicePlanService } from './servicePlan.service';
import { ServicePlanCreateSchema, ServicePlanUpdateSchema } from '@i-itsm/shared';
import { logger } from '../../utils/logger';

export class ServicePlanController {
  /**
   * POST /api/v1/catalog/service-plans
   * Create a new service plan
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ServicePlanCreateSchema.parse(req.body);
      const servicePlan = await servicePlanService.createServicePlan(validated);

      res.status(201).json({
        success: true,
        data: servicePlan,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/catalog/service-plans/:id
   * Get a service plan by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const servicePlan = await servicePlanService.getServicePlanById(id);

      res.status(200).json({
        success: true,
        data: servicePlan,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/catalog/service-plans/:id
   * Update a service plan
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = ServicePlanUpdateSchema.parse(req.body);
      const servicePlan = await servicePlanService.updateServicePlan(id, validated);

      res.status(200).json({
        success: true,
        data: servicePlan,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/catalog/service-plans/:id
   * Delete a service plan
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await servicePlanService.deleteServicePlan(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/catalog/service-plans
   * List service plans with filters
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { serviceId, limit = '50', skip = '0' } = req.query;

      const result = await servicePlanService.listServicePlans({
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

export const servicePlanController = new ServicePlanController();
