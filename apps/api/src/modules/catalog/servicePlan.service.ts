import { ServicePlanModel } from './servicePlan.model';
import { ServiceService } from './service.service';
import { ServicePlanCreateInput, ServicePlanUpdateInput, ServicePlan } from '@i-itsm/shared';
import { AppError } from '@i-itsm/shared';
import { logger } from '../../utils/logger';

export class ServicePlanService {
  constructor(private serviceService: ServiceService) {}

  /**
   * Create a new service plan
   */
  async createServicePlan(data: ServicePlanCreateInput): Promise<ServicePlan> {
    try {
      // Verify service exists
      await this.serviceService.getServiceById(data.serviceId);

      const servicePlan = new ServicePlanModel(data);
      await servicePlan.save();
      logger.info({ servicePlanId: servicePlan._id }, 'Service plan created');
      return servicePlan.toObject() as any as ServicePlan;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to create service plan');
      throw error;
    }
  }

  /**
   * Get service plan by ID
   */
  async getServicePlanById(id: string): Promise<ServicePlan> {
    try {
      const servicePlan = await ServicePlanModel.findById(id);
      if (!servicePlan) {
        throw new AppError('Service plan not found', 404);
      }
      return servicePlan.toObject() as any as ServicePlan;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to get service plan');
      throw error;
    }
  }

  /**
   * Update service plan
   */
  async updateServicePlan(
    id: string,
    data: ServicePlanUpdateInput
  ): Promise<ServicePlan> {
    try {
      // If updating service, verify it exists
      if (data.serviceId) {
        await this.serviceService.getServiceById(data.serviceId);
      }

      const servicePlan = await ServicePlanModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      );

      if (!servicePlan) {
        throw new AppError('Service plan not found', 404);
      }

      logger.info({ servicePlanId: id }, 'Service plan updated');
      return servicePlan.toObject() as any as ServicePlan;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to update service plan');
      throw error;
    }
  }

  /**
   * Delete service plan
   */
  async deleteServicePlan(id: string): Promise<void> {
    try {
      const servicePlan = await ServicePlanModel.findByIdAndDelete(id);
      if (!servicePlan) {
        throw new AppError('Service plan not found', 404);
      }
      logger.info({ servicePlanId: id }, 'Service plan deleted');
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to delete service plan');
      throw error;
    }
  }

  /**
   * List service plans with filters
   */
  async listServicePlans(filters: {
    serviceId?: string;
    limit?: number;
    skip?: number;
  } = {}): Promise<{ data: ServicePlan[]; total: number }> {
    try {
      const { serviceId, limit = 50, skip = 0 } = filters;

      const query: any = {};
      if (serviceId) query.serviceId = serviceId;

      const [data, total] = await Promise.all([
        ServicePlanModel.find(query)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip)
          .lean(),
        ServicePlanModel.countDocuments(query),
      ]);

      return {
        data: data as any as ServicePlan[],
        total,
      };
    } catch (error) {
      logger.error(error, 'Failed to list service plans');
      throw error;
    }
  }
}

export const servicePlanService = new ServicePlanService(new ServiceService(new (require('./serviceGroup.service').ServiceGroupService)()));

