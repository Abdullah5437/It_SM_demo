import { ServiceModel } from './service.model';
import { ServiceGroupService } from './serviceGroup.service';
import { ServiceCreateInput, ServiceUpdateInput, Service } from '@i-itsm/shared';
import { AppError } from '@i-itsm/shared';
import { logger } from '../../utils/logger';

export class ServiceService {
  constructor(private serviceGroupService: ServiceGroupService) {}

  /**
   * Create a new service
   */
  async createService(data: ServiceCreateInput): Promise<Service> {
    try {
      // Verify service group exists
      await this.serviceGroupService.getServiceGroupById(data.serviceGroupId);

      const service = new ServiceModel(data);
      await service.save();
      logger.info({ serviceId: service._id }, 'Service created');
      return service.toObject() as any as Service;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to create service');
      throw error;
    }
  }

  /**
   * Get service by ID
   */
  async getServiceById(id: string): Promise<Service> {
    try {
      const service = await ServiceModel.findById(id);
      if (!service) {
        throw new AppError('Service not found', 404);
      }
      return service.toObject() as any as Service;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to get service');
      throw error;
    }
  }

  /**
   * Update service
   */
  async updateService(id: string, data: ServiceUpdateInput): Promise<Service> {
    try {
      // If updating service group, verify it exists
      if (data.serviceGroupId) {
        await this.serviceGroupService.getServiceGroupById(data.serviceGroupId);
      }

      const service = await ServiceModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      );

      if (!service) {
        throw new AppError('Service not found', 404);
      }

      logger.info({ serviceId: id }, 'Service updated');
      return service.toObject() as any as Service;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to update service');
      throw error;
    }
  }

  /**
   * Delete service
   */
  async deleteService(id: string): Promise<void> {
    try {
      const service = await ServiceModel.findByIdAndDelete(id);
      if (!service) {
        throw new AppError('Service not found', 404);
      }
      logger.info({ serviceId: id }, 'Service deleted');
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to delete service');
      throw error;
    }
  }

  /**
   * List services with filters
   */
  async listServices(filters: {
    serviceGroupId?: string;
    type?: string;
    status?: string;
    limit?: number;
    skip?: number;
  } = {}): Promise<{ data: Service[]; total: number }> {
    try {
      const { serviceGroupId, type, status, limit = 50, skip = 0 } = filters;

      const query: any = {};
      if (serviceGroupId) query.serviceGroupId = serviceGroupId;
      if (type) query.type = type;
      if (status) query.status = status;

      const [data, total] = await Promise.all([
        ServiceModel.find(query)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip)
          .lean(),
        ServiceModel.countDocuments(query),
      ]);

      return {
        data: data as any as Service[],
        total,
      };
    } catch (error) {
      logger.error(error, 'Failed to list services');
      throw error;
    }
  }
}

export const serviceService = new ServiceService(new ServiceGroupService());

