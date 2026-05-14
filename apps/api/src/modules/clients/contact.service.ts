import { ClientContactModel } from './contact.model';
import { ClientService } from './client.service';
import { ClientContactCreateInput, ClientContactUpdateInput, ClientContact } from '@i-itsm/shared';
import { AppError } from '@i-itsm/shared';
import { logger } from '../../utils/logger';

export class ClientContactService {
  constructor(private clientService: ClientService) {}

  /**
   * Create a new contact for a client
   */
  async createContact(clientId: string, data: ClientContactCreateInput): Promise<ClientContact> {
    try {
      // Verify client exists
      await this.clientService.getClientById(clientId);

      // If this is marked as primary, unmark other primary contacts
      if (data.isPrimary) {
        await ClientContactModel.updateMany(
          { clientId, isPrimary: true },
          { $set: { isPrimary: false } }
        );
      }

      const contact = new ClientContactModel({
        ...data,
        clientId,
      });

      await contact.save();
      logger.info({ clientId, contactId: contact._id }, 'Contact created');
      return contact.toObject() as any as ClientContact;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to create contact');
      throw error;
    }
  }

  /**
   * Get contact by ID
   */
  async getContactById(clientId: string, contactId: string): Promise<ClientContact> {
    try {
      const contact = await ClientContactModel.findOne({
        _id: contactId,
        clientId,
      });

      if (!contact) {
        throw new AppError('Contact not found', 404);
      }

      return contact.toObject() as any as ClientContact;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to get contact');
      throw error;
    }
  }

  /**
   * Update contact
   */
  async updateContact(
    clientId: string,
    contactId: string,
    data: ClientContactUpdateInput
  ): Promise<ClientContact> {
    try {
      // If marking as primary, unmark other primary contacts
      if (data.isPrimary) {
        await ClientContactModel.updateMany(
          { clientId, _id: { $ne: contactId }, isPrimary: true },
          { $set: { isPrimary: false } }
        );
      }

      const contact = await ClientContactModel.findOneAndUpdate(
        { _id: contactId, clientId },
        { $set: data },
        { new: true, runValidators: true }
      );

      if (!contact) {
        throw new AppError('Contact not found', 404);
      }

      logger.info({ clientId, contactId }, 'Contact updated');
      return contact.toObject() as any as ClientContact;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to update contact');
      throw error;
    }
  }

  /**
   * Delete contact
   */
  async deleteContact(clientId: string, contactId: string): Promise<void> {
    try {
      const contact = await ClientContactModel.findOneAndDelete({
        _id: contactId,
        clientId,
      });

      if (!contact) {
        throw new AppError('Contact not found', 404);
      }

      logger.info({ clientId, contactId }, 'Contact deleted');
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to delete contact');
      throw error;
    }
  }

  /**
   * List contacts for a client
   */
  async listContactsByClientId(
    clientId: string,
    filters: {
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{ data: ClientContact[]; total: number }> {
    try {
      // Verify client exists
      await this.clientService.getClientById(clientId);

      const { limit = 50, skip = 0 } = filters;

      const [data, total] = await Promise.all([
        ClientContactModel.find({ clientId })
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip)
          .lean(),
        ClientContactModel.countDocuments({ clientId }),
      ]);

      return {
        data: data as any as ClientContact[],
        total,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(error, 'Failed to list contacts');
      throw error;
    }
  }
}

export const clientContactService = new ClientContactService(
  new ClientService()
);

