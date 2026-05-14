import { Order, IOrder, OrderLineItem } from './order.model';
import mongoose from 'mongoose';
import { logger } from '../../utils/logger';

export class OrderService {
  /**
   * Auto-generate the next sequential order number
   * Format: ORD-YYYYMM-XXXXX where XXXXX is zero-padded sequential counter
   */
  async generateOrderNo(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `ORD-${year}${month}-`;

    // Find the highest existing order number with this month's prefix
    const lastOrder = await Order.findOne({
      orderNo: { $regex: `^${prefix}` }
    })
      .sort({ orderNo: -1 })
      .select('orderNo')
      .lean();

    let nextSeq = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNo.replace(prefix, ''), 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    const orderNo = `${prefix}${String(nextSeq).padStart(5, '0')}`;
    return orderNo;
  }

  async createOrder(
    clientName: string,
    clientEmail: string | undefined,
    currency: string,
    lines: OrderLineItem[],
    createdBy: string,
    quoteId?: string
  ): Promise<IOrder> {
    try {
      // Auto-generate the order number
      const orderNo = await this.generateOrderNo();

      const order = new Order({
        orderNo,
        quoteId: quoteId ? new mongoose.Types.ObjectId(quoteId) : undefined,
        orderDate: new Date(),
        status: 'pending',
        currency,
        clientName,
        clientEmail: clientEmail || undefined,
        lines,
        createdBy: new mongoose.Types.ObjectId(createdBy),
      });

      await order.save();
      logger.info({ orderNo }, 'Order created successfully');
      return order;
    } catch (error) {
      logger.error({ error }, 'Failed to create order');
      throw error;
    }
  }

  async getOrderById(id: string): Promise<IOrder | null> {
    try {
      const order = await Order.findById(id).lean();
      return order as unknown as IOrder | null;
    } catch (error) {
      logger.error({ error, orderId: id }, 'Failed to fetch order');
      throw error;
    }
  }

  async updateOrder(id: string, updates: Partial<IOrder>): Promise<IOrder | null> {
    try {
      const order = await Order.findById(id);
      if (!order) throw new Error('Order not found');

      // Prevent updating the order number
      if (updates.orderNo) {
        throw new Error('Order number cannot be changed');
      }

      // Allow updating orders in any status
      Object.assign(order, updates);
      await order.save();
      logger.info({ orderId: id }, 'Order updated successfully');
      return order;
    } catch (error) {
      logger.error({ error, orderId: id }, 'Failed to update order');
      throw error;
    }
  }

  async deleteOrder(id: string): Promise<void> {
    try {
      const order = await Order.findByIdAndDelete(id);
      if (!order) throw new Error('Order not found');
      logger.info({ orderId: id }, 'Order deleted successfully');
    } catch (error) {
      logger.error({ error, orderId: id }, 'Failed to delete order');
      throw error;
    }
  }

  async cancelOrder(id: string): Promise<IOrder | null> {
    try {
      const order = await Order.findById(id);
      if (!order) throw new Error('Order not found');

      if (['completed', 'cancelled'].includes(order.status)) {
        throw new Error('Cannot cancel a completed or already cancelled order');
      }

      order.status = 'cancelled';
      await order.save();
      logger.info({ orderId: id }, 'Order cancelled successfully');
      return order;
    } catch (error) {
      logger.error({ error, orderId: id }, 'Failed to cancel order');
      throw error;
    }
  }

  async listOrders(
    clientId?: string,
    status?: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<{ orders: IOrder[]; total: number }> {
    try {
      const filter: any = {};
      if (clientId) filter.clientId = new mongoose.Types.ObjectId(clientId);
      if (status) filter.status = status;

      const [orders, total] = await Promise.all([
        Order.find(filter)
          .sort({ orderDate: -1 })
          .limit(limit)
          .skip(skip)
          .lean(),
        Order.countDocuments(filter),
      ]);

      return { orders: orders as unknown as IOrder[], total };
    } catch (error) {
      logger.error({ error }, 'Failed to list orders');
      throw error;
    }
  }

  async getOrderStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    confirmedOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalSalesCents: number;
    totalCostCents: number;
    totalProfitCents: number;
  }> {
    try {
      // Last 30 days date boundary
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get all orders from last 30 days
      const orders = await Order.find({
        orderDate: { $gte: thirtyDaysAgo }
      }).lean();

      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
      const completedOrders = orders.filter(o => o.status === 'completed').length;
      const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

      // Sales: sum of lineTotalCents only for completed orders
      let totalSalesCents = 0;
      let totalCostCents = 0;

      for (const order of orders) {
        if (order.status === 'completed') {
          for (const line of order.lines) {
            totalSalesCents += line.lineTotalCents;
          }
        }
      }

      // Cost is calculated as sum of (unitPriceCents * qty) only for completed orders
      for (const order of orders) {
        if (order.status === 'completed') {
          for (const line of order.lines) {
            totalCostCents += line.unitPriceCents * line.qty;
          }
        }
      }

      const totalProfitCents = totalSalesCents - totalCostCents;

      return {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        completedOrders,
        cancelledOrders,
        totalSalesCents,
        totalCostCents,
        totalProfitCents,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get order stats');
      throw error;
    }
  }

  /**
   * Get product-level sales data for charts (which products sold most)
   * @param period 'daily' | 'weekly' | 'monthly' | 'yearly'
   */
  async getProductSales(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<{ label: string; value: number }[]> {
    try {
      let startDate: Date;
      const now = new Date();

      switch (period) {
        case 'daily':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'weekly':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 84);
          break;
        case 'monthly':
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 12);
          break;
        case 'yearly':
          startDate = new Date(now);
          startDate.setFullYear(startDate.getFullYear() - 5);
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
      }

      const orders = await Order.find({
        orderDate: { $gte: startDate },
        status: { $ne: 'cancelled' }
      }).lean();

      // Aggregate sales by product description
      const productMap = new Map<string, number>();

      for (const order of orders) {
        for (const line of order.lines) {
          const productName = line.description || 'Unknown';
          const total = line.lineTotalCents;
          productMap.set(productName, (productMap.get(productName) || 0) + total);
        }
      }

      // Convert to sorted array (highest first)
      const result: { label: string; value: number }[] = [];
      for (const [label, value] of productMap.entries()) {
        result.push({ label, value: Math.round((value / 100) * 100) / 100 });
      }

      result.sort((a, b) => b.value - a.value);

      return result;
    } catch (error) {
      logger.error({ error, period }, 'Failed to get product sales data');
      throw error;
    }
  }

  /**
   * Get sales chart data grouped by period
   * @param period 'daily' | 'weekly' | 'monthly' | 'yearly'
   */
  async getSalesChart(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<{ label: string; value: number }[]> {
    try {
      let startDate: Date;
      const now = new Date();

      switch (period) {
        case 'daily':
          // Last 30 days, group by day
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'weekly':
          // Last 12 weeks
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 84);
          break;
        case 'monthly':
          // Last 12 months
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 12);
          break;
        case 'yearly':
          // Last 5 years
          startDate = new Date(now);
          startDate.setFullYear(startDate.getFullYear() - 5);
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
      }

      const orders = await Order.find({
        orderDate: { $gte: startDate },
        status: { $ne: 'cancelled' }
      }).lean();

      // Group sales by period
      const salesMap = new Map<string, number>();

      for (const order of orders) {
        const d = new Date(order.orderDate);
        let key: string;

        switch (period) {
          case 'daily': {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthName = months[d.getMonth()];
            const day = d.getDate();
            key = `${monthName} ${day}`;
            break;
          }
          case 'weekly': {
            // Get the Monday of the week
            const dayOfWeek = d.getDay();
            const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            const monday = new Date(d.setDate(diff));
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monMonthName = months[monday.getMonth()];
            const monDay = monday.getDate();
            key = `Wk ${monMonthName} ${monDay}`;
            break;
          }
          case 'monthly': {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            key = `${months[d.getMonth()]} ${d.getFullYear()}`;
            break;
          }
          case 'yearly': {
            key = String(d.getFullYear());
            break;
          }
          default:
            key = String(d.toISOString().split('T')[0]);
        }

        const total = order.lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
        salesMap.set(key, (salesMap.get(key) || 0) + total);
      }

      // Convert to sorted array
      const result: { label: string; value: number }[] = [];
      for (const [label, value] of salesMap.entries()) {
        result.push({ label, value: Math.round(value / 100 * 100) / 100 }); // Convert cents to dollars
      }

      // Sort by date key
      result.sort((a, b) => {
        if (period === 'yearly') {
          return parseInt(a.label) - parseInt(b.label);
        }
        return a.label.localeCompare(b.label);
      });

      return result;
    } catch (error) {
      logger.error({ error, period }, 'Failed to get sales chart data');
      throw error;
    }
  }

  /**
   * Get dashboard slider data (orders stats, low stock alerts, important updates)
   */
  async getDashboardSlides(): Promise<{ title: string; description: string; items: string[] }[]> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);

      // Today's orders
      const todayOrders = await Order.find({
        orderDate: { $gte: todayStart, $lt: tomorrowStart },
      }).lean();

      const todayOrderCount = todayOrders.length;
      const todayRevenueCents = todayOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.lines.reduce((s, l) => s + l.lineTotalCents, 0), 0);

      // Pending orders
      const pendingOrders = await Order.countDocuments({ status: 'pending' });

      // Completed orders (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const completedOrders = await Order.countDocuments({
        orderDate: { $gte: thirtyDaysAgo },
        status: 'completed'
      });

      // Top product today
      const todayProductSales = new Map<string, number>();
      for (const order of todayOrders) {
        for (const line of order.lines) {
          const name = line.description || 'Unknown';
          todayProductSales.set(name, (todayProductSales.get(name) || 0) + line.lineTotalCents);
        }
      }
      let topProductToday = 'N/A';
      let topSales = 0;
      for (const [name, sales] of todayProductSales) {
        if (sales > topSales) {
          topSales = sales;
          topProductToday = name;
        }
      }

      // Try to get low stock alerts from inventory module
      let lowStockCount = 0;
      let outOfStockCount = 0;
      try {
        const { default: StockLevel } = await import('../inventory/stockLevel.model');
        lowStockCount = await StockLevel.countDocuments({
          $expr: { $lte: ['$qtyOnHand', '$reorderPoint'] }
        });
        outOfStockCount = await StockLevel.countDocuments({ qtyOnHand: 0 });
      } catch {
        // inventory module not available
      }

      const todayRevenue = Math.round((todayRevenueCents / 100) * 100) / 100;

      return [
        {
          title: "Today's Orders",
          description: `${todayOrderCount} order${todayOrderCount !== 1 ? 's' : ''} today · $${todayRevenue.toFixed(2)} revenue`,
          items: [
            `${pendingOrders} pending order${pendingOrders !== 1 ? 's' : ''} need${pendingOrders === 1 ? 's' : ''} attention`,
            `${completedOrders} completed in last 30 days`,
            `Top product today: ${topProductToday}`,
            `${todayOrderCount} order${todayOrderCount !== 1 ? 's' : ''} placed today`,
            `${todayOrders.filter(o => o.status === 'cancelled').length} cancelled today`,
          ],
        },
        {
          title: "Inventory Alerts",
          description: `${lowStockCount} low stock item${lowStockCount !== 1 ? 's' : ''}`,
          items: [
            `${outOfStockCount} product${outOfStockCount !== 1 ? 's' : ''} out of stock`,
            `${lowStockCount} item${lowStockCount !== 1 ? 's' : ''} at or below reorder point`,
            outOfStockCount > 0 ? `Re-stock urgently needed for ${outOfStockCount} product${outOfStockCount !== 1 ? 's' : ''}` : 'Stock levels are healthy',
            `Review inventory for timely re-ordering`,
            `Check warehouse stock allocations regularly`,
          ],
        },
        {
          title: "Sales Summary",
          description: `$${todayRevenue.toFixed(2)} revenue today`,
          items: [
            `${todayOrderCount} order${todayOrderCount !== 1 ? 's' : ''} today`,
            `Best seller: ${topProductToday} ($${(topSales / 100).toFixed(2)})`,
            `${todayOrders.filter(o => o.status === 'pending').length} order${todayOrders.filter(o => o.status === 'pending').length !== 1 ? 's' : ''} pending confirmation`,
            `${completedOrders} order${completedOrders !== 1 ? 's' : ''} completed this month`,
            `${pendingOrders} total pending across all periods`,
          ],
        },
      ];
    } catch (error) {
      logger.error({ error }, 'Failed to get dashboard slides');
      return [];
    }
  }

  /**
   * Get daily activity data for the timeline (orders count, sales, top product)
   */
  async getDailyActivity(): Promise<{ date: string; ordersCount: number; totalSales: number; topProduct: string }[]> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const orders = await Order.find({
        orderDate: { $gte: sevenDaysAgo },
        status: { $ne: 'cancelled' }
      }).lean();

      // Group by day
      const dayMap = new Map<string, { ordersCount: number; totalSales: number; productSales: Map<string, number> }>();

      for (const order of orders) {
        const d = new Date(order.orderDate);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dateKey = `${months[d.getMonth()]} ${d.getDate()}`;

        if (!dayMap.has(dateKey)) {
          dayMap.set(dateKey, { ordersCount: 0, totalSales: 0, productSales: new Map() });
        }

        const dayData = dayMap.get(dateKey)!;
        dayData.ordersCount += 1;

        const orderTotal = order.lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
        dayData.totalSales += orderTotal;

        for (const line of order.lines) {
          const prodName = line.description || 'Unknown';
          dayData.productSales.set(prodName, (dayData.productSales.get(prodName) || 0) + line.lineTotalCents);
        }
      }

      const result: { date: string; ordersCount: number; totalSales: number; topProduct: string }[] = [];
      for (const [date, data] of dayMap.entries()) {
        // Find top product for this day
        let topProduct = 'None';
        let topSales = 0;
        for (const [prodName, sales] of data.productSales.entries()) {
          if (sales > topSales) {
            topSales = sales;
            topProduct = prodName;
          }
        }

        result.push({
          date,
          ordersCount: data.ordersCount,
          totalSales: Math.round((data.totalSales / 100) * 100) / 100,
          topProduct,
        });
      }

      // Sort by date (reverse chronological - most recent first)
      result.reverse();

      return result;
    } catch (error) {
      logger.error({ error }, 'Failed to get daily activity');
      throw error;
    }
  }
}

export const orderService = new OrderService();
