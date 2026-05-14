import { Request, Response, NextFunction } from 'express';
import { creditNoteService } from './creditNote.service';

export class CreditNoteController {
  async createCreditNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId, invoiceId, amountCents, reason, currency } = req.body;

      const creditNote = await creditNoteService.createCreditNote(
        clientId,
        invoiceId,
        amountCents,
        reason,
        currency
      );

      res.status(201).json({
        success: true,
        data: creditNote,
        message: 'Credit note created successfully',
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async getCreditNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const creditNote = await creditNoteService.getCreditNoteById(id);

      if (!creditNote) {
        res.status(404).json({
          success: false,
          error: 'Credit note not found',
        });
        return;
      }

      res.json({
        success: true,
        data: creditNote,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async listCreditNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId, invoiceId, limit = 50, skip = 0 } = req.query;

      const { creditNotes, total } = await creditNoteService.listCreditNotes(
        clientId as string | undefined,
        invoiceId as string | undefined,
        parseInt(limit as string),
        parseInt(skip as string)
      );

      res.json({
        success: true,
        data: creditNotes,
        pagination: { limit: parseInt(limit as string), skip: parseInt(skip as string), total },
      });
    } catch (error) {
      next(error);
    }
  }

  async applyCredit(req: Request, res: Response, next: NextFunction) {
    try {
      const { creditNoteId } = req.params;
      const { targetInvoiceId } = req.body;

      await creditNoteService.applyCreditToInvoice(creditNoteId, targetInvoiceId);

      res.json({
        success: true,
        message: 'Credit note applied successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const creditNoteController = new CreditNoteController();
