import { Request, Response, NextFunction } from 'express';
import { orderService } from './order.service';

export class OrderController {
  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientName, clientEmail, currency, lines, quoteId } = req.body;
      const createdBy = (req.user as any)?.id;

      const order = await orderService.createOrder(
        clientName,
        clientEmail,
        currency,
        lines,
        createdBy,
        quoteId
      );

      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully',
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Order not found',
        });
        return;
      }

      res.json({
        success: true,
        data: order,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async updateOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await orderService.updateOrder(id, req.body);

      res.json({
        success: true,
        data: order,
        message: 'Order updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await orderService.cancelOrder(id);

      res.json({
        success: true,
        data: order,
        message: 'Order cancelled successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await orderService.deleteOrder(id);

      res.json({
        success: true,
        message: 'Order deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async listOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId, status, limit = 50, skip = 0 } = req.query;

      const { orders, total } = await orderService.listOrders(
        clientId as string | undefined,
        status as string | undefined,
        parseInt(limit as string),
        parseInt(skip as string)
      );

      res.json({
        success: true,
        data: orders,
        pagination: { limit: parseInt(limit as string), skip: parseInt(skip as string), total },
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await orderService.getOrderStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getSalesChart(req: Request, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'daily';
      const data = await orderService.getSalesChart(period);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getProductSales(req: Request, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'daily';
      const data = await orderService.getProductSales(period);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getDailyActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await orderService.getDailyActivity();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getDashboardSlides(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await orderService.getDashboardSlides();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();
