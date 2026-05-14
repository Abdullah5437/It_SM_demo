import { Request, Response, NextFunction } from 'express';
import { clientContactService } from './contact.service';
import { ClientContactCreateSchema, ClientContactUpdateSchema } from '@i-itsm/shared';
import { logger } from '../../utils/logger';

export class ClientContactController {
  /**
   * POST /api/v1/clients/:clientId/contacts
   * Create a new contact for a client
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const validated = ClientContactCreateSchema.omit({ clientId: true }).parse(req.body);
      const contact = await clientContactService.createContact(clientId, {
        ...validated,
        clientId,
      } as any);

      res.status(201).json({
        success: true,
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/clients/:clientId/contacts/:id
   * Get a contact by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId, id } = req.params;
      const contact = await clientContactService.getContactById(clientId, id);

      res.status(200).json({
        success: true,
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/clients/:clientId/contacts/:id
   * Update a contact
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId, id } = req.params;
      const validated = ClientContactUpdateSchema.parse(req.body);
      const contact = await clientContactService.updateContact(clientId, id, validated);

      res.status(200).json({
        success: true,
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/clients/:clientId/contacts/:id
   * Delete a contact
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId, id } = req.params;
      await clientContactService.deleteContact(clientId, id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/clients/:clientId/contacts
   * List all contacts for a client
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const { limit = '50', skip = '0' } = req.query;

      const result = await clientContactService.listContactsByClientId(clientId, {
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

export const clientContactController = new ClientContactController();
