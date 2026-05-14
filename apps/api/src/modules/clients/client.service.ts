import { ClientModel } from './client.model';
import { ClientCreateInput, ClientUpdateInput, Client } from '@i-itsm/shared';
import { AppError } from '@i-itsm/shared';
import { logger } from '../../utils/logger';
import { toPlainObject } from '../../utils';

export class ClientService {
  /**
   * Create a new client
   */
  async createClient(data: ClientCreateInput): Promise<Client> {
    try {
      // Check if clientCode already exists
      const existing = await ClientModel.findOne({ clientCode: data.clientCode });
      if (existing) {
        throw new AppError('Client code already exists', 400);
      }

      const client = new ClientModel({
        ...data,
        denormalizedCounters: {
          openInvoiceBalanceCents: 0,
          overdueBalanceCents: 0,
          activeSubscriptionsCount: 0,
        },
      });

      await client.save();
      logger.info({ clientId: client._id }, 'Client created');
      return toPlainObject(client) as Client;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to create client');
      throw error;
    }
  }

  /**
   * Get client by ID
   */
  async getClientById(id: string): Promise<Client> {
    try {
      const client = await ClientModel.findById(id);
      if (!client) {
        throw new AppError('Client not found', 404);
      }
      return toPlainObject(client) as Client;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to get client');
      throw error;
    }
  }

  /**
   * Get client by code
   */
  async getClientByCode(clientCode: string): Promise<Client> {
    try {
      const client = await ClientModel.findOne({ clientCode });
      if (!client) {
        throw new AppError('Client not found', 404);
      }
      return client.toObject() as any as Client;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to get client by code');
      throw error;
    }
  }

  /**
   * Update client
   */
  async updateClient(id: string, data: ClientUpdateInput): Promise<Client> {
    try {
      // If updating clientCode, check for uniqueness
      if (data.clientCode) {
        const existing = await ClientModel.findOne({
          clientCode: data.clientCode,
          _id: { $ne: id },
        });
        if (existing) {
          throw new AppError('Client code already exists', 400);
        }
      }

      const client = await ClientModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      );

      if (!client) {
        throw new AppError('Client not found', 404);
      }

      logger.info({ clientId: id }, 'Client updated');
      return client.toObject() as any as Client;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to update client');
      throw error;
    }
  }

  /**
   * Delete client
   */
  async deleteClient(id: string): Promise<void> {
    try {
      const client = await ClientModel.findByIdAndDelete(id);
      if (!client) {
        throw new AppError('Client not found', 404);
      }
      logger.info({ clientId: id }, 'Client deleted');
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to delete client');
      throw error;
    }
  }

  /**
   * List clients with pagination and filters
   */
  async listClients(
    filters: {
      status?: string;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{ data: Client[]; total: number }> {
    try {
      const { status, limit = 50, skip = 0 } = filters;

      const query: any = {};
      if (status) {
        query.status = status;
      }

      const [data, total] = await Promise.all([
        ClientModel.find(query)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip)
          .lean(),
        ClientModel.countDocuments(query),
      ]);

      return {
        data: data as any as Client[],
        total,
      };
    } catch (error) {
      logger.error(error, 'Failed to list clients');
      throw error;
    }
  }

  /**
   * Update denormalized counters for a client
   * Used by related modules to keep aggregations in sync
   */
  async updateCounters(
    clientId: string,
    counters: {
      openInvoiceBalanceCents?: number;
      overdueBalanceCents?: number;
      activeSubscriptionsCount?: number;
    }
  ): Promise<Client> {
    try {
      const update: any = {};

      if (counters.openInvoiceBalanceCents !== undefined) {
        update['denormalizedCounters.openInvoiceBalanceCents'] =
          counters.openInvoiceBalanceCents;
      }
      if (counters.overdueBalanceCents !== undefined) {
        update['denormalizedCounters.overdueBalanceCents'] = counters.overdueBalanceCents;
      }
      if (counters.activeSubscriptionsCount !== undefined) {
        update['denormalizedCounters.activeSubscriptionsCount'] =
          counters.activeSubscriptionsCount;
      }

      const client = await ClientModel.findByIdAndUpdate(
        clientId,
        { $set: update },
        { new: true, runValidators: true }
      );

      if (!client) {
        throw new AppError('Client not found', 404);
      }

      return client.toObject() as any as Client;
    } catch (error) {
      logger.error(error, 'Failed to update client counters');
      throw error;
    }
  }
}

export const clientService = new ClientService();

