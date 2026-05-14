import { Request, Response, NextFunction } from 'express';
import { clientService } from './client.service';
import { ClientCreateSchema, ClientUpdateSchema } from '@i-itsm/shared';
import { logger } from '../../utils/logger';

export class ClientController {
  /**
   * POST /api/v1/clients
   * Create a new client
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ClientCreateSchema.parse(req.body);
      const client = await clientService.createClient(validated);

      res.status(201).json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/clients/:id
   * Get a client by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const client = await clientService.getClientById(id);

      res.status(200).json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/clients/:id
   * Update a client
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = ClientUpdateSchema.parse(req.body);
      const client = await clientService.updateClient(id, validated);

      res.status(200).json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/clients/:id
   * Delete a client
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await clientService.deleteClient(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/clients
   * List clients with pagination and filters
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, limit = '50', skip = '0' } = req.query;

      const result = await clientService.listClients({
        status: status as string | undefined,
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

export const clientController = new ClientController();
