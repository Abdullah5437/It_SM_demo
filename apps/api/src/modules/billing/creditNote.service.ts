import { CreditNote, ICreditNote } from './creditNote.model';
import { Invoice, IInvoice } from './invoice.model';
import mongoose from 'mongoose';
import { logger } from '../../utils/logger';

export class CreditNoteService {
  async createCreditNote(
    clientId: string,
    invoiceId: string,
    amountCents: number,
    reason: string,
    currency: string
  ): Promise<ICreditNote> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const invoice = await Invoice.findById(invoiceId).session(session);
      if (!invoice) {
        await session.abortTransaction();
        throw new Error('Invoice not found');
      }

      // Generate unique credit number
      const creditNo = await this.generateCreditNo();

      const creditNote = new CreditNote({
        creditNo,
        clientId: new mongoose.Types.ObjectId(clientId),
        invoiceId: new mongoose.Types.ObjectId(invoiceId),
        issueDate: new Date(),
        amountCents,
        currency,
        reason,
      });

      await creditNote.save({ session });

      // Update invoice balance if applicable
      if (['issued', 'part_paid'].includes(invoice.status)) {
        invoice.balanceCents = Math.max(0, invoice.balanceCents - amountCents);
        if (invoice.balanceCents === 0) {
          invoice.status = 'paid';
        }
        await invoice.save({ session });
      }

      await session.commitTransaction();

      logger.info({ creditNo, invoiceId }, 'Credit note created successfully');
      return creditNote;
    } catch (error) {
      await session.abortTransaction();
      logger.error({ error }, 'Failed to create credit note');
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getCreditNoteById(id: string): Promise<ICreditNote | null> {
    try {
      const note = await CreditNote.findById(id).lean();
      return note as unknown as ICreditNote | null;
    } catch (error) {
      logger.error({ error, creditNoteId: id }, 'Failed to fetch credit note');
      throw error;
    }
  }

  async listCreditNotes(
    clientId?: string,
    invoiceId?: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<{ creditNotes: ICreditNote[]; total: number }> {
    try {
      const filter: any = {};
      if (clientId) filter.clientId = new mongoose.Types.ObjectId(clientId);
      if (invoiceId) filter.invoiceId = new mongoose.Types.ObjectId(invoiceId);

      const [creditNotes, total] = await Promise.all([
        CreditNote.find(filter)
          .sort({ issueDate: -1 })
          .limit(limit)
          .skip(skip)
          .lean(),
        CreditNote.countDocuments(filter),
      ]);

      return { creditNotes: creditNotes as unknown as ICreditNote[], total };
    } catch (error) {
      logger.error({ error }, 'Failed to list credit notes');
      throw error;
    }
  }

  async applyCreditToInvoice(creditNoteId: string, targetInvoiceId: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const creditNote = await CreditNote.findById(creditNoteId).session(session);
      if (!creditNote) {
        await session.abortTransaction();
        throw new Error('Credit note not found');
      }

      const invoice = await Invoice.findById(targetInvoiceId).session(session);
      if (!invoice) {
        await session.abortTransaction();
        throw new Error('Target invoice not found');
      }

      if (['paid', 'void'].includes(invoice.status)) {
        await session.abortTransaction();
        throw new Error('Cannot apply credit to paid or void invoices');
      }

      // Apply credit
      invoice.balanceCents = Math.max(0, invoice.balanceCents - creditNote.amountCents);
      if (invoice.balanceCents === 0) {
        invoice.status = 'paid';
      } else if (invoice.status === 'issued') {
        invoice.status = 'part_paid';
      }

      await invoice.save({ session });
      await session.commitTransaction();

      logger.info(
        { creditNoteId, targetInvoiceId },
        'Credit note applied to invoice successfully'
      );
    } catch (error) {
      await session.abortTransaction();
      logger.error(
        { error, creditNoteId, targetInvoiceId },
        'Failed to apply credit to invoice'
      );
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async generateCreditNo(): Promise<string> {
    const count = await CreditNote.countDocuments();
    const year = new Date().getFullYear();
    return `CN-${year}-${String(count + 1).padStart(6, '0')}`;
  }
}

export const creditNoteService = new CreditNoteService();
