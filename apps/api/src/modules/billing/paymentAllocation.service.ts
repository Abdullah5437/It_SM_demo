import { PaymentAllocation, IPaymentAllocation } from './paymentAllocation.model';
import { Payment, IPayment } from './payment.model';
import { Invoice, IInvoice } from './invoice.model';
import mongoose from 'mongoose';
import { logger } from '../../utils/logger';

export class PaymentAllocationService {
  async allocatePaymentToInvoice(
    paymentId: string,
    invoiceId: string,
    amountCents: number
  ): Promise<IPaymentAllocation> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Load payment and invoice
      const payment = await Payment.findById(paymentId).session(session);
      if (!payment) {
        await session.abortTransaction();
        throw new Error('Payment not found');
      }

      const invoice = await Invoice.findById(invoiceId).session(session);
      if (!invoice) {
        await session.abortTransaction();
        throw new Error('Invoice not found');
      }

      // Validate payment status
      if (payment.status !== 'confirmed') {
        await session.abortTransaction();
        throw new Error('Payment must be confirmed to allocate');
      }

      // Validate invoice status
      if (['paid', 'void'].includes(invoice.status)) {
        await session.abortTransaction();
        throw new Error('Cannot allocate to paid or void invoices');
      }

      // Validate amount
      const paymentBalance = await this.getPaymentBalance(paymentId, session);
      if (amountCents > paymentBalance) {
        await session.abortTransaction();
        throw new Error('Allocation amount exceeds payment balance');
      }

      if (amountCents > invoice.balanceCents) {
        await session.abortTransaction();
        throw new Error('Allocation amount exceeds invoice balance');
      }

      // Create allocation record
      const allocation = new PaymentAllocation({
        paymentId: new mongoose.Types.ObjectId(paymentId),
        invoiceId: new mongoose.Types.ObjectId(invoiceId),
        amountCents,
      });

      await allocation.save({ session });

      // Update invoice balance
      invoice.balanceCents -= amountCents;

      // Update invoice status if fully paid
      if (invoice.balanceCents === 0) {
        invoice.status = 'paid';
      } else if (invoice.status === 'issued') {
        invoice.status = 'part_paid';
      }

      await invoice.save({ session });

      await session.commitTransaction();

      logger.info(
        { paymentId, invoiceId, amountCents },
        'Payment allocated to invoice successfully'
      );
      return allocation;
    } catch (error) {
      await session.abortTransaction();
      logger.error(
        { error, paymentId, invoiceId },
        'Failed to allocate payment to invoice'
      );
      throw error;
    } finally {
      session.endSession();
    }
  }

  async autoAllocatePayment(paymentId: string): Promise<IPaymentAllocation[]> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const payment = await Payment.findById(paymentId).session(session);
      if (!payment) {
        await session.abortTransaction();
        throw new Error('Payment not found');
      }

      if (payment.status !== 'confirmed') {
        await session.abortTransaction();
        throw new Error('Payment must be confirmed');
      }

      // Get overdue invoices sorted by dueDate
      const overdueInvoices = await Invoice.find({
        clientId: payment.clientId,
        dueDate: { $lt: new Date() },
        status: { $in: ['issued', 'part_paid'] },
      })
        .sort({ dueDate: 1 })
        .session(session);

      const allocations: IPaymentAllocation[] = [];
      let remainingAmount = payment.amountCents;

      for (const invoice of overdueInvoices) {
        if (remainingAmount <= 0) break;

        const allocationAmount = Math.min(remainingAmount, invoice.balanceCents);

        const allocation = new PaymentAllocation({
          paymentId: new mongoose.Types.ObjectId(paymentId),
          invoiceId: invoice._id,
          amountCents: allocationAmount,
        });

        await allocation.save({ session });
        allocations.push(allocation);

        invoice.balanceCents -= allocationAmount;
        if (invoice.balanceCents === 0) {
          invoice.status = 'paid';
        } else {
          invoice.status = 'part_paid';
        }
        await invoice.save({ session });

        remainingAmount -= allocationAmount;
      }

      await session.commitTransaction();

      logger.info(
        { paymentId, allocationsCount: allocations.length },
        'Payment auto-allocated successfully'
      );
      return allocations;
    } catch (error) {
      await session.abortTransaction();
      logger.error({ error, paymentId }, 'Failed to auto-allocate payment');
      throw error;
    } finally {
      session.endSession();
    }
  }

  async listAllocations(
    paymentId: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<{ allocations: IPaymentAllocation[]; total: number }> {
    try {
      const [allocations, total] = await Promise.all([
        PaymentAllocation.find({ paymentId: new mongoose.Types.ObjectId(paymentId) })
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip)
          .lean(),
        PaymentAllocation.countDocuments({
          paymentId: new mongoose.Types.ObjectId(paymentId),
        }),
      ]);

      return { allocations: allocations as unknown as IPaymentAllocation[], total };
    } catch (error) {
      logger.error({ error, paymentId }, 'Failed to list allocations');
      throw error;
    }
  }

  private async getPaymentBalance(
    paymentId: string,
    session?: mongoose.ClientSession
  ): Promise<number> {
    try {
      const query = Payment.findById(paymentId);
      if (session) query.session(session);
      const payment = await query;
      if (!payment) throw new Error('Payment not found');

      const allocated = await PaymentAllocation.aggregate([
        { $match: { paymentId: new mongoose.Types.ObjectId(paymentId) } },
        { $group: { _id: null, total: { $sum: '$amountCents' } } },
      ]);

      const allocatedAmount = allocated.length > 0 ? allocated[0].total : 0;
      return payment.amountCents - allocatedAmount;
    } catch (error) {
      logger.error({ error, paymentId }, 'Failed to calculate payment balance');
      throw error;
    }
  }
}

export const paymentAllocationService = new PaymentAllocationService();
