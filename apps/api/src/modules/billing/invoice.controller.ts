import { Request, Response, NextFunction } from 'express';
import { invoiceService } from './invoice.service';

export class InvoiceController {
  async createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId, lines, dueDate, currency, orderId } = req.body;
      const createdBy = (req.user as any)?.id;

      const invoice = await invoiceService.createInvoice(
        clientId,
        lines,
        new Date(dueDate),
        currency,
        createdBy,
        orderId
      );

      res.status(201).json({
        success: true,
        data: invoice,
        message: 'Invoice created successfully',
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async getInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const invoice = await invoiceService.getInvoiceById(id);

      if (!invoice) {
        res.status(404).json({
          success: false,
          error: 'Invoice not found',
        });
        return;
      }

      res.json({
        success: true,
        data: invoice,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async updateInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const invoice = await invoiceService.updateInvoice(id, req.body);

      res.json({
        success: true,
        data: invoice,
        message: 'Invoice updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async issueInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const invoice = await invoiceService.issueInvoice(id);

      res.json({
        success: true,
        data: invoice,
        message: 'Invoice issued successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async voidInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const invoice = await invoiceService.voidInvoice(id);

      res.json({
        success: true,
        data: invoice,
        message: 'Invoice voided successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async listInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId, status, limit = 50, skip = 0 } = req.query;

      const { invoices, total } = await invoiceService.listInvoices(
        clientId as string | undefined,
        status as string | undefined,
        parseInt(limit as string),
        parseInt(skip as string)
      );

      res.json({
        success: true,
        data: invoices,
        pagination: { limit: parseInt(limit as string), skip: parseInt(skip as string), total },
      });
    } catch (error) {
      next(error);
    }
  }

  async getInvoicePDF(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const invoice = await invoiceService.getInvoiceById(id);

      if (!invoice || !invoice.pdf) {
        res.status(404).json({
          success: false,
          error: 'Invoice PDF not found',
        });
        return;
      }

      // TODO: Fetch PDF from storage using invoice.pdf.storageKey
      res.json({
        success: true,
        data: { storageKey: invoice.pdf.storageKey, generatedAt: invoice.pdf.generatedAt },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const invoiceController = new InvoiceController();
