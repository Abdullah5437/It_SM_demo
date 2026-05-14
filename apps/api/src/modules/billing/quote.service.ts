import { Quote, IQuote, QuoteLineItem, QuoteTotals } from './quote.model';
import mongoose from 'mongoose';
import { logger } from '../../utils/logger';

export class QuoteService {
  async createQuote(
    clientId: string,
    issueDate: Date,
    validUntil: Date,
    currency: string,
    lines: QuoteLineItem[],
    createdBy: string
  ): Promise<IQuote> {
    try {
      // Calculate totals
      const totals = this.calculateTotals(lines);

      // Generate unique quote number
      const quoteNo = await this.generateQuoteNo();

      const quote = new Quote({
        quoteNo,
        clientId: new mongoose.Types.ObjectId(clientId),
        issueDate,
        validUntil,
        status: 'draft',
        currency,
        totals,
        lines,
        createdBy: new mongoose.Types.ObjectId(createdBy),
      });

      await quote.save();
      logger.info({ quoteNo }, 'Quote created successfully');
      return quote;
    } catch (error) {
      logger.error({ error }, 'Failed to create quote');
      throw error;
    }
  }

  async getQuoteById(id: string): Promise<IQuote | null> {
    try {
      const quote = await Quote.findById(id).lean();
      return quote as unknown as IQuote | null;
    } catch (error) {
      logger.error({ error, quoteId: id }, 'Failed to fetch quote');
      throw error;
    }
  }

  async updateQuote(id: string, updates: Partial<IQuote>): Promise<IQuote | null> {
    try {
      const quote = await Quote.findById(id);
      if (!quote) throw new Error('Quote not found');

      // Only draft quotes can be updated
      if (quote.status !== 'draft') {
        throw new Error('Only draft quotes can be updated');
      }

      // Recalculate totals if lines changed
      if (updates.lines) {
        updates.totals = this.calculateTotals(updates.lines);
      }

      Object.assign(quote, updates);
      await quote.save();
      logger.info({ quoteId: id }, 'Quote updated successfully');
      return quote;
    } catch (error) {
      logger.error({ error, quoteId: id }, 'Failed to update quote');
      throw error;
    }
  }

  async deleteQuote(id: string): Promise<boolean> {
    try {
      const quote = await Quote.findById(id);
      if (!quote) throw new Error('Quote not found');

      // Only draft quotes can be deleted
      if (quote.status !== 'draft') {
        throw new Error('Only draft quotes can be deleted');
      }

      await Quote.deleteOne({ _id: id });
      logger.info({ quoteId: id }, 'Quote deleted successfully');
      return true;
    } catch (error) {
      logger.error({ error, quoteId: id }, 'Failed to delete quote');
      throw error;
    }
  }

  async listQuotes(
    clientId?: string,
    status?: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<{ quotes: IQuote[]; total: number }> {
    try {
      const filter: any = {};
      if (clientId) filter.clientId = new mongoose.Types.ObjectId(clientId);
      if (status) filter.status = status;

      const [quotes, total] = await Promise.all([
        Quote.find(filter)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip)
          .lean(),
        Quote.countDocuments(filter),
      ]);

      return { quotes: quotes as unknown as IQuote[], total };
    } catch (error) {
      logger.error({ error }, 'Failed to list quotes');
      throw error;
    }
  }

  async convertQuoteToOrder(quoteId: string, createdBy: string): Promise<any> {
    try {
      const quote = await Quote.findById(quoteId);
      if (!quote) throw new Error('Quote not found');

      if (quote.status !== 'issued') {
        throw new Error('Only issued quotes can be converted to orders');
      }

      // Import Order here to avoid circular dependency
      const { Order } = require('./order.model');

      // Create order from quote
      const orderNo = await this.generateOrderNo();
      const order = new Order({
        orderNo,
        clientId: quote.clientId,
        quoteId: quote._id,
        orderDate: new Date(),
        status: 'pending',
        currency: quote.currency,
        lines: quote.lines,
        createdBy: new mongoose.Types.ObjectId(createdBy),
      });

      await order.save();

      // Update quote status
      quote.status = 'accepted';
      await quote.save();

      logger.info({ quoteId, orderNo }, 'Quote converted to order successfully');
      return order;
    } catch (error) {
      logger.error({ error, quoteId }, 'Failed to convert quote to order');
      throw error;
    }
  }

  async issueQuote(id: string): Promise<IQuote | null> {
    try {
      const quote = await Quote.findById(id);
      if (!quote) throw new Error('Quote not found');

      if (quote.status !== 'draft') {
        throw new Error('Only draft quotes can be issued');
      }

      quote.status = 'issued';
      await quote.save();
      logger.info({ quoteId: id }, 'Quote issued successfully');
      return quote;
    } catch (error) {
      logger.error({ error, quoteId: id }, 'Failed to issue quote');
      throw error;
    }
  }

  private calculateTotals(lines: QuoteLineItem[]): QuoteTotals {
    const subTotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
    const taxCents = lines.reduce((sum, line) => {
      const taxAmount = (line.lineTotalCents * line.taxRateBps) / 10000;
      return sum + Math.round(taxAmount);
    }, 0);

    return {
      subTotalCents,
      taxCents,
      totalCents: subTotalCents + taxCents,
    };
  }

  private async generateQuoteNo(): Promise<string> {
    const count = await Quote.countDocuments();
    const year = new Date().getFullYear();
    return `QT-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  private async generateOrderNo(): Promise<string> {
    const { Order } = require('./order.model');
    const count = await Order.countDocuments();
    const year = new Date().getFullYear();
    return `ORD-${year}-${String(count + 1).padStart(6, '0')}`;
  }
}

export const quoteService = new QuoteService();
