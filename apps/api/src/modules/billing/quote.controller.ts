import { Request, Response, NextFunction } from 'express';
import { quoteService } from './quote.service';
import { logger } from '../../utils/logger';

export class QuoteController {
  async createQuote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId, issueDate, validUntil, currency, lines } = req.body;
      const createdBy = (req.user as any)?.id;

      const quote = await quoteService.createQuote(
        clientId,
        new Date(issueDate),
        new Date(validUntil),
        currency,
        lines,
        createdBy
      );

      res.status(201).json({
        success: true,
        data: quote,
        message: 'Quote created successfully',
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async getQuote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const quote = await quoteService.getQuoteById(id);

      if (!quote) {
        res.status(404).json({
          success: false,
          error: 'Quote not found',
        });
        return;
      }

      res.json({
        success: true,
        data: quote,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async updateQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const quote = await quoteService.updateQuote(id, req.body);

      res.json({
        success: true,
        data: quote,
        message: 'Quote updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await quoteService.deleteQuote(id);

      res.json({
        success: true,
        message: 'Quote deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async listQuotes(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId, status, limit = 50, skip = 0 } = req.query;

      const { quotes, total } = await quoteService.listQuotes(
        clientId as string | undefined,
        status as string | undefined,
        parseInt(limit as string),
        parseInt(skip as string)
      );

      res.json({
        success: true,
        data: quotes,
        pagination: { limit: parseInt(limit as string), skip: parseInt(skip as string), total },
      });
    } catch (error) {
      next(error);
    }
  }

  async issueQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const quote = await quoteService.issueQuote(id);

      res.json({
        success: true,
        data: quote,
        message: 'Quote issued successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async convertToOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const createdBy = (req.user as any)?.id;

      const order = await quoteService.convertQuoteToOrder(id, createdBy);

      res.status(201).json({
        success: true,
        data: order,
        message: 'Quote converted to order successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const quoteController = new QuoteController();
