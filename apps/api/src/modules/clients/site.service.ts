import { ClientSiteModel } from './site.model';
import { ClientService } from './client.service';
import { ClientSiteCreateInput, ClientSiteUpdateInput, ClientSite } from '@i-itsm/shared';
import { AppError } from '@i-itsm/shared';
import { logger } from '../../utils/logger';

export class ClientSiteService {
  constructor(private clientService: ClientService) {}

  /**
   * Create a new site for a client
   */
  async createSite(clientId: string, data: ClientSiteCreateInput): Promise<ClientSite> {
    try {
      // Verify client exists
      await this.clientService.getClientById(clientId);

      const site = new ClientSiteModel({
        ...data,
        clientId,
      });

      await site.save();
      logger.info({ clientId, siteId: site._id }, 'Site created');
      return site.toObject() as any as ClientSite;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to create site');
      throw error;
    }
  }

  /**
   * Get site by ID
   */
  async getSiteById(clientId: string, siteId: string): Promise<ClientSite> {
    try {
      const site = await ClientSiteModel.findOne({
        _id: siteId,
        clientId,
      });

      if (!site) {
        throw new AppError('Site not found', 404);
      }

      return site.toObject() as any as ClientSite;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to get site');
      throw error;
    }
  }

  /**
   * Update site
   */
  async updateSite(
    clientId: string,
    siteId: string,
    data: ClientSiteUpdateInput
  ): Promise<ClientSite> {
    try {
      const site = await ClientSiteModel.findOneAndUpdate(
        { _id: siteId, clientId },
        { $set: data },
        { new: true, runValidators: true }
      );

      if (!site) {
        throw new AppError('Site not found', 404);
      }

      logger.info({ clientId, siteId }, 'Site updated');
      return site.toObject() as any as ClientSite;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to update site');
      throw error;
    }
  }

  /**
   * Delete site
   */
  async deleteSite(clientId: string, siteId: string): Promise<void> {
    try {
      const site = await ClientSiteModel.findOneAndDelete({
        _id: siteId,
        clientId,
      });

      if (!site) {
        throw new AppError('Site not found', 404);
      }

      logger.info({ clientId, siteId }, 'Site deleted');
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to delete site');
      throw error;
    }
  }

  /**
   * List sites for a client
   */
  async listSitesByClientId(
    clientId: string,
    filters: {
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{ data: ClientSite[]; total: number }> {
    try {
      // Verify client exists
      await this.clientService.getClientById(clientId);

      const { limit = 50, skip = 0 } = filters;

      const [data, total] = await Promise.all([
        ClientSiteModel.find({ clientId })
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip)
          .lean(),
        ClientSiteModel.countDocuments({ clientId }),
      ]);

      return {
        data: data as any as ClientSite[],
        total,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to list sites');
      throw error;
    }
  }
}

export const clientSiteService = new ClientSiteService(new ClientService());

