import { Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service';
import { paymentAllocationService } from './paymentAllocation.service';

export class PaymentController {
  async createPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId, paymentDate, method, reference, amountCents, currency } = req.body;

      const payment = await paymentService.createPayment(
        clientId,
        new Date(paymentDate),
        method,
        reference,
        amountCents,
        currency
      );

      res.status(201).json({
        success: true,
        data: payment,
        message: 'Payment created successfully',
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async getPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const payment = await paymentService.getPaymentById(id);

      if (!payment) {
        res.status(404).json({
          success: false,
          error: 'Payment not found',
        });
        return;
      }

      res.json({
        success: true,
        data: payment,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async confirmPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const payment = await paymentService.confirmPayment(id);

      res.json({
        success: true,
        data: payment,
        message: 'Payment confirmed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async listPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId, limit = 50, skip = 0 } = req.query;

      const { payments, total } = await paymentService.listPayments(
        clientId as string | undefined,
        parseInt(limit as string),
        parseInt(skip as string)
      );

      res.json({
        success: true,
        data: payments,
        pagination: { limit: parseInt(limit as string), skip: parseInt(skip as string), total },
      });
    } catch (error) {
      next(error);
    }
  }

  async allocatePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      const { invoiceId, amountCents } = req.body;

      const allocation = await paymentAllocationService.allocatePaymentToInvoice(
        paymentId,
        invoiceId,
        amountCents
      );

      res.status(201).json({
        success: true,
        data: allocation,
        message: 'Payment allocated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async autoAllocatePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;

      const allocations = await paymentAllocationService.autoAllocatePayment(paymentId);

      res.json({
        success: true,
        data: allocations,
        message: `Payment auto-allocated to ${allocations.length} invoice(s)`,
      });
    } catch (error) {
      next(error);
    }
  }

  async listAllocations(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      const { limit = 50, skip = 0 } = req.query;

      const { allocations, total } = await paymentAllocationService.listAllocations(
        paymentId,
        parseInt(limit as string),
        parseInt(skip as string)
      );

      res.json({
        success: true,
        data: allocations,
        pagination: { limit: parseInt(limit as string), skip: parseInt(skip as string), total },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
