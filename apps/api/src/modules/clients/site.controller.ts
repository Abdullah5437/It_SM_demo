import { Request, Response, NextFunction } from 'express';
import { clientSiteService } from './site.service';
import { ClientSiteCreateSchema, ClientSiteUpdateSchema } from '@i-itsm/shared';
import { logger } from '../../utils/logger';

export class ClientSiteController {
  /**
   * POST /api/v1/clients/:clientId/sites
   * Create a new site for a client
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const validated = ClientSiteCreateSchema.omit({ clientId: true }).parse(req.body);
      const site = await clientSiteService.createSite(clientId, {
        ...validated,
        clientId,
      } as any);

      res.status(201).json({
        success: true,
        data: site,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/clients/:clientId/sites/:id
   * Get a site by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId, id } = req.params;
      const site = await clientSiteService.getSiteById(clientId, id);

      res.status(200).json({
        success: true,
        data: site,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/clients/:clientId/sites/:id
   * Update a site
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId, id } = req.params;
      const validated = ClientSiteUpdateSchema.parse(req.body);
      const site = await clientSiteService.updateSite(clientId, id, validated);

      res.status(200).json({
        success: true,
        data: site,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/clients/:clientId/sites/:id
   * Delete a site
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId, id } = req.params;
      await clientSiteService.deleteSite(clientId, id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/clients/:clientId/sites
   * List all sites for a client
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const { limit = '50', skip = '0' } = req.query;

      const result = await clientSiteService.listSitesByClientId(clientId, {
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

export const clientSiteController = new ClientSiteController();
