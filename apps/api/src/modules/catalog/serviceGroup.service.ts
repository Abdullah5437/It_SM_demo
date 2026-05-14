import { ServiceGroupModel } from './serviceGroup.model';
import { ServiceGroupCreateInput, ServiceGroupUpdateInput, ServiceGroup } from '@i-itsm/shared';
import { AppError } from '@i-itsm/shared';
import { logger } from '../../utils/logger';

export class ServiceGroupService {
  /**
   * Create a new service group
   */
  async createServiceGroup(data: ServiceGroupCreateInput): Promise<ServiceGroup> {
    try {
      const existing = await ServiceGroupModel.findOne({ name: data.name });
      if (existing) {
        throw new AppError('Service group name already exists', 400);
      }

      const serviceGroup = new ServiceGroupModel(data);
      await serviceGroup.save();
      logger.info({ serviceGroupId: serviceGroup._id }, 'Service group created');
      return serviceGroup.toObject() as any as ServiceGroup;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to create service group');
      throw error;
    }
  }

  /**
   * Get service group by ID
   */
  async getServiceGroupById(id: string): Promise<ServiceGroup> {
    try {
      const serviceGroup = await ServiceGroupModel.findById(id);
      if (!serviceGroup) {
        throw new AppError('Service group not found', 404);
      }
      return serviceGroup.toObject() as any as ServiceGroup;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to get service group');
      throw error;
    }
  }

  /**
   * Update service group
   */
  async updateServiceGroup(
    id: string,
    data: ServiceGroupUpdateInput
  ): Promise<ServiceGroup> {
    try {
      if (data.name) {
        const existing = await ServiceGroupModel.findOne({
          name: data.name,
          _id: { $ne: id },
        });
        if (existing) {
          throw new AppError('Service group name already exists', 400);
        }
      }

      const serviceGroup = await ServiceGroupModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      );

      if (!serviceGroup) {
        throw new AppError('Service group not found', 404);
      }

      logger.info({ serviceGroupId: id }, 'Service group updated');
      return serviceGroup.toObject() as any as ServiceGroup;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to update service group');
      throw error;
    }
  }

  /**
   * Delete service group
   */
  async deleteServiceGroup(id: string): Promise<void> {
    try {
      const serviceGroup = await ServiceGroupModel.findByIdAndDelete(id);
      if (!serviceGroup) {
        throw new AppError('Service group not found', 404);
      }
      logger.info({ serviceGroupId: id }, 'Service group deleted');
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to delete service group');
      throw error;
    }
  }

  /**
   * List all service groups
   */
  async listServiceGroups(filters: {
    limit?: number;
    skip?: number;
  } = {}): Promise<{ data: ServiceGroup[]; total: number }> {
    try {
      const { limit = 50, skip = 0 } = filters;

      const [data, total] = await Promise.all([
        ServiceGroupModel.find()
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip)
          .lean(),
        ServiceGroupModel.countDocuments(),
      ]);

      return {
        data: data as any as ServiceGroup[],
        total,
      };
    } catch (error) {
      logger.error(error, 'Failed to list service groups');
      throw error;
    }
  }
}

export const serviceGroupService = new ServiceGroupService();

