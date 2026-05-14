import { Request, Response, NextFunction } from 'express';
import { billingService } from './billing.service';

export class BillingController {
  async getBillingSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;

      const summary = await billingService.getBillingSummary(clientId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const billingController = new BillingController();
