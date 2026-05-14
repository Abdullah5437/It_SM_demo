import { ClientModel } from '../clients/client.model';
import { ClientContactModel } from '../clients/contact.model';
import { ClientSiteModel } from '../clients/site.model';
import { ClientHoldings } from '@i-itsm/shared';
import { AppError } from '@i-itsm/shared';
import { logger } from '../../utils/logger';

export class HoldingsService {
  /**
   * Get aggregated holdings for a client
   * This endpoint ties together:
   * - Client profile
   * - Client contacts
   * - Client sites
   * - Assets (placeholder for future inventory module)
   * - Subscriptions (placeholder for future subscriptions module)
   * - VoIP (placeholder for future VoIP module)
   * - Support contracts (placeholder for future support module)
   */
  async getClientHoldings(clientId: string): Promise<ClientHoldings> {
    try {
      // Verify client exists and fetch their data
      const client = await ClientModel.findById(clientId);
      if (!client) {
        throw new AppError('Client not found', 404);
      }

      // Execute parallel queries for all related data
      const [_contacts, _sites] = await Promise.all([
        ClientContactModel.find({ clientId }).lean(),
        ClientSiteModel.find({ clientId }).lean(),
      ]);

      // Build the aggregated response
      const holdings: ClientHoldings = {
        client: client.toObject() as any,
        assets: [], // Placeholder - will be populated by inventory module
        subscriptions: [], // Placeholder - will be populated by subscriptions module
        voip: [], // Placeholder - will be populated by VoIP module
        supportContracts: [], // Placeholder - will be populated by support module
        totals: {
          openBalanceCents: client.denormalizedCounters?.openInvoiceBalanceCents || 0,
          overdueBalanceCents: client.denormalizedCounters?.overdueBalanceCents || 0,
          activeSubscriptionsCount:
            client.denormalizedCounters?.activeSubscriptionsCount || 0,
        },
      };

      logger.info({ clientId }, 'Client holdings retrieved');
      return holdings;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to get client holdings');
      throw error;
    }
  }
}

export const holdingsService = new HoldingsService();

