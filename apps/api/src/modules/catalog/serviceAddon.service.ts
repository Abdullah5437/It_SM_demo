import { ServiceAddonModel } from './serviceAddon.model';
import { ServiceService } from './service.service';
import { ServiceAddonCreateInput, ServiceAddonUpdateInput, ServiceAddon } from '@i-itsm/shared';
import { AppError } from '@i-itsm/shared';
import { logger } from '../../utils/logger';

export class ServiceAddonService {
  constructor(private serviceService: ServiceService) {}

  /**
   * Create a new service addon
   */
  async createServiceAddon(data: ServiceAddonCreateInput): Promise<ServiceAddon> {
    try {
      // Verify service exists
      await this.serviceService.getServiceById(data.serviceId);

      const serviceAddon = new ServiceAddonModel(data);
      await serviceAddon.save();
      logger.info({ serviceAddonId: serviceAddon._id }, 'Service addon created');
      return serviceAddon.toObject() as any as ServiceAddon;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to create service addon');
      throw error;
    }
  }

  /**
   * Get service addon by ID
   */
  async getServiceAddonById(id: string): Promise<ServiceAddon> {
    try {
      const serviceAddon = await ServiceAddonModel.findById(id);
      if (!serviceAddon) {
        throw new AppError('Service addon not found', 404);
      }
      return serviceAddon.toObject() as any as ServiceAddon;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to get service addon');
      throw error;
    }
  }

  /**
   * Update service addon
   */
  async updateServiceAddon(
    id: string,
    data: ServiceAddonUpdateInput
  ): Promise<ServiceAddon> {
    try {
      // If updating service, verify it exists
      if (data.serviceId) {
        await this.serviceService.getServiceById(data.serviceId);
      }

      const serviceAddon = await ServiceAddonModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      );

      if (!serviceAddon) {
        throw new AppError('Service addon not found', 404);
      }

      logger.info({ serviceAddonId: id }, 'Service addon updated');
      return serviceAddon.toObject() as any as ServiceAddon;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to update service addon');
      throw error;
    }
  }

  /**
   * Delete service addon
   */
  async deleteServiceAddon(id: string): Promise<void> {
    try {
      const serviceAddon = await ServiceAddonModel.findByIdAndDelete(id);
      if (!serviceAddon) {
        throw new AppError('Service addon not found', 404);
      }
      logger.info({ serviceAddonId: id }, 'Service addon deleted');
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to delete service addon');
      throw error;
    }
  }

  /**
   * List service addons with filters
   */
  async listServiceAddons(filters: {
    serviceId?: string;
    limit?: number;
    skip?: number;
  } = {}): Promise<{ data: ServiceAddon[]; total: number }> {
    try {
      const { serviceId, limit = 50, skip = 0 } = filters;

      const query: any = {};
      if (serviceId) query.serviceId = serviceId;

      const [data, total] = await Promise.all([
        ServiceAddonModel.find(query)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip)
          .lean(),
        ServiceAddonModel.countDocuments(query),
      ]);

      return {
        data: data as any as ServiceAddon[],
        total,
      };
    } catch (error) {
      logger.error(error, 'Failed to list service addons');
      throw error;
    }
  }
}

export const serviceAddonService = new ServiceAddonService(new ServiceService(new (require('./serviceGroup.service').ServiceGroupService)()));

