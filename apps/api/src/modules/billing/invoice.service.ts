import { Invoice, IInvoice, InvoiceLineItem, InvoiceTotals } from './invoice.model';
import mongoose from 'mongoose';
import { logger } from '../../utils/logger';

export class InvoiceService {
  async createInvoice(
   
    lines: InvoiceLineItem[],
    dueDate: Date,
    currency: string,
    createdBy: string,
    orderId?: string
  ): Promise<IInvoice> {
    try {
      // Calculate totals
      const totals = this.calculateTotals(lines);

      // Generate unique invoice number
      const invoiceNo = await this.generateInvoiceNo();

      const invoice = new Invoice({
        invoiceNo,
        orderId: orderId ? new mongoose.Types.ObjectId(orderId) : undefined,
        status: 'draft',
        issueDate: new Date(),
        dueDate,
        currency,
        totals,
        balanceCents: totals.totalCents,
        lines,
        createdBy: new mongoose.Types.ObjectId(createdBy),
      });

      await invoice.save();
      logger.info({ invoiceNo }, 'Invoice created successfully');
      return invoice;
    } catch (error) {
      logger.error({ error }, 'Failed to create invoice');
      throw error;
    }
  }

  async getInvoiceById(id: string): Promise<IInvoice | null> {
    try {
      const invoice = await Invoice.findById(id).lean();
      return invoice as unknown as IInvoice | null;
    } catch (error) {
      logger.error({ error, invoiceId: id }, 'Failed to fetch invoice');
      throw error;
    }
  }

  async updateInvoice(id: string, updates: Partial<IInvoice>): Promise<IInvoice | null> {
    try {
      const invoice = await Invoice.findById(id);
      if (!invoice) throw new Error('Invoice not found');

      // Only draft invoices can be updated
      if (invoice.status !== 'draft') {
        throw new Error('Only draft invoices can be updated');
      }

      // Recalculate totals if lines changed
      if (updates.lines) {
        const newTotals = this.calculateTotals(updates.lines);
        updates.totals = newTotals;
        // Update balance if no payment allocation yet
        if (invoice.balanceCents === invoice.totals.totalCents) {
          updates.balanceCents = newTotals.totalCents;
        }
      }

      Object.assign(invoice, updates);
      await invoice.save();
      logger.info({ invoiceId: id }, 'Invoice updated successfully');
      return invoice;
    } catch (error) {
      logger.error({ error, invoiceId: id }, 'Failed to update invoice');
      throw error;
    }
  }

  async issueInvoice(id: string): Promise<IInvoice | null> {
    try {
      const invoice = await Invoice.findById(id);
      if (!invoice) throw new Error('Invoice not found');

      if (invoice.status !== 'draft') {
        throw new Error('Only draft invoices can be issued');
      }

      invoice.status = invoice.balanceCents === 0 ? 'paid' : 'issued';
      invoice.issueDate = new Date();
      await invoice.save();
      logger.info({ invoiceId: id }, 'Invoice issued successfully');
      return invoice;
    } catch (error) {
      logger.error({ error, invoiceId: id }, 'Failed to issue invoice');
      throw error;
    }
  }

  async voidInvoice(id: string): Promise<IInvoice | null> {
    try {
      const invoice = await Invoice.findById(id);
      if (!invoice) throw new Error('Invoice not found');

      if (invoice.status === 'void') {
        throw new Error('Invoice is already void');
      }

      invoice.status = 'void';
      invoice.balanceCents = 0;
      await invoice.save();
      logger.info({ invoiceId: id }, 'Invoice voided successfully');
      return invoice;
    } catch (error) {
      logger.error({ error, invoiceId: id }, 'Failed to void invoice');
      throw error;
    }
  }

  async listInvoices(
    clientId?: string,
    status?: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<{ invoices: IInvoice[]; total: number }> {
    try {
      const filter: any = {};
      if (clientId) filter.clientId = new mongoose.Types.ObjectId(clientId);
      if (status) filter.status = status;

      const [invoices, total] = await Promise.all([
        Invoice.find(filter)
          .sort({ issueDate: -1 })
          .limit(limit)
          .skip(skip)
          .lean(),
        Invoice.countDocuments(filter),
      ]);

      return { invoices: invoices as unknown as IInvoice[], total };
    } catch (error) {
      logger.error({ error }, 'Failed to list invoices');
      throw error;
    }
  }

  async getOverdueInvoices(
    clientId: string,
    beforeDate: Date = new Date()
  ): Promise<IInvoice[]> {
    try {
      const invoices = await Invoice.find({
        clientId: new mongoose.Types.ObjectId(clientId),
        dueDate: { $lt: beforeDate },
        status: { $in: ['issued', 'part_paid'] },
      })
        .sort({ dueDate: 1 })
        .lean();
      return invoices as unknown as IInvoice[];
    } catch (error) {
      logger.error({ error, clientId }, 'Failed to get overdue invoices');
      throw error;
    }
  }

  private calculateTotals(lines: InvoiceLineItem[]): InvoiceTotals {
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

  private async generateInvoiceNo(): Promise<string> {
    const count = await Invoice.countDocuments();
    const year = new Date().getFullYear();
    return `INV-${year}-${String(count + 1).padStart(6, '0')}`;
  }
}

export const invoiceService = new InvoiceService();
