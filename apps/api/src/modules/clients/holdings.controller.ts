import { Request, Response, NextFunction } from 'express';
import { holdingsService } from './holdings.service';
import { logger } from '../../utils/logger';

export class HoldingsController {
  /**
   * GET /api/v1/clients/:id/holdings
   * Get aggregated holdings for a client
   */
  async getHoldings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const holdings = await holdingsService.getClientHoldings(id);

      res.status(200).json({
        success: true,
        data: holdings,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const holdingsController = new HoldingsController();
