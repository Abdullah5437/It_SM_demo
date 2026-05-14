import { Payment, IPayment } from './payment.model';
import mongoose from 'mongoose';
import { logger } from '../../utils/logger';

export class PaymentService {
  async createPayment(
    clientId: string,
    paymentDate: Date,
    method: string,
    reference: string,
    amountCents: number,
    currency: string
  ): Promise<IPayment> {
    try {
      if (amountCents <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      const payment = new Payment({
        clientId: new mongoose.Types.ObjectId(clientId),
        paymentDate,
        method,
        reference,
        amountCents,
        currency,
        status: 'pending',
      });

      await payment.save();
      logger.info({ paymentId: payment._id, reference }, 'Payment created successfully');
      return payment;
    } catch (error) {
      logger.error({ error }, 'Failed to create payment');
      throw error;
    }
  }

  async getPaymentById(id: string): Promise<IPayment | null> {
    try {
      const payment = await Payment.findById(id).lean();
      return payment as unknown as IPayment | null;
    } catch (error) {
      logger.error({ error, paymentId: id }, 'Failed to fetch payment');
      throw error;
    }
  }

  async confirmPayment(id: string): Promise<IPayment | null> {
    try {
      const payment = await Payment.findById(id);
      if (!payment) throw new Error('Payment not found');

      payment.status = 'confirmed';
      await payment.save();
      logger.info({ paymentId: id }, 'Payment confirmed successfully');
      return payment;
    } catch (error) {
      logger.error({ error, paymentId: id }, 'Failed to confirm payment');
      throw error;
    }
  }

  async listPayments(
    clientId?: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<{ payments: IPayment[]; total: number }> {
    try {
      const filter: any = {};
      if (clientId) filter.clientId = new mongoose.Types.ObjectId(clientId);

      const [payments, total] = await Promise.all([
        Payment.find(filter)
          .sort({ paymentDate: -1 })
          .limit(limit)
          .skip(skip)
          .lean(),
        Payment.countDocuments(filter),
      ]);

      return { payments: payments as unknown as IPayment[], total };
    } catch (error) {
      logger.error({ error }, 'Failed to list payments');
      throw error;
    }
  }

  async getPaymentBalance(paymentId: string): Promise<number> {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) throw new Error('Payment not found');

      // Import here to avoid circular dependency
      const { PaymentAllocation } = require('./paymentAllocation.model');

      const allocated = await PaymentAllocation.aggregate([
        { $match: { paymentId: new mongoose.Types.ObjectId(paymentId) } },
        { $group: { _id: null, total: { $sum: '$amountCents' } } },
      ]);

      const allocatedAmount = allocated.length > 0 ? allocated[0].total : 0;
      return payment.amountCents - allocatedAmount;
    } catch (error) {
      logger.error({ error, paymentId }, 'Failed to get payment balance');
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
