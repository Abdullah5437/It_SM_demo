import { Invoice } from './invoice.model';
import mongoose from 'mongoose';
import { logger } from '../../utils/logger';

export interface BillingSummary {
  clientId: string;
  totalInvoicesCents: number;
  openInvoiceBalanceCents: number;
  overdueBalanceCents: number;
  paidInvoicesCents: number;
  creditBalanceCents: number;
  invoicesByStatus: {
    draft: number;
    issued: number;
    part_paid: number;
    paid: number;
    void: number;
  };
  recentInvoices: any[];
  recentPayments: any[];
}

export class BillingService {
  async getBillingSummary(clientId: string): Promise<BillingSummary> {
    try {
      const clientObjectId = new mongoose.Types.ObjectId(clientId);

      // Get invoice aggregation
      const invoiceAgg = await Invoice.aggregate([
        { $match: { clientId: clientObjectId } },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  totalInvoicesCents: {
                    $sum: { $cond: [{ $ne: ['$status', 'void'] }, '$totals.totalCents', 0] },
                  },
                  openInvoiceBalanceCents: {
                    $sum: {
                      $cond: [
                        { $in: ['$status', ['issued', 'part_paid']] },
                        '$balanceCents',
                        0,
                      ],
                    },
                  },
                  paidInvoicesCents: {
                    $sum: {
                      $cond: [{ $eq: ['$status', 'paid'] }, '$totals.totalCents', 0],
                    },
                  },
                },
              },
            ],
            statusCounts: [
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 },
                },
              },
            ],
            overdue: [
              {
                $match: {
                  dueDate: { $lt: new Date() },
                  status: { $in: ['issued', 'part_paid'] },
                },
              },
              {
                $group: {
                  _id: null,
                  overdueBalanceCents: { $sum: '$balanceCents' },
                },
              },
            ],
            recentInvoices: [
              { $sort: { issueDate: -1 } },
              { $limit: 10 },
              {
                $project: {
                  _id: 1,
                  invoiceNo: 1,
                  status: 1,
                  totals: 1,
                  balanceCents: 1,
                  dueDate: 1,
                  issueDate: 1,
                },
              },
            ],
          },
        },
      ]);

      const result = invoiceAgg[0];

      // Calculate totals from aggregation
      const totalData = result.totals[0] || {
        totalInvoicesCents: 0,
        openInvoiceBalanceCents: 0,
        paidInvoicesCents: 0,
      };

      const overdueData = result.overdue[0] || { overdueBalanceCents: 0 };

      // Convert status counts to map
      const statusMap: Record<string, number> = {
        draft: 0,
        issued: 0,
        part_paid: 0,
        paid: 0,
        void: 0,
      };

      result.statusCounts.forEach((item: any) => {
        statusMap[item._id] = item.count;
      });

      // TODO: Get credit balance from CreditNote model when available
      // For now, set to 0
      const creditBalanceCents = 0;

      // TODO: Get recent payments when Payment integration is complete
      const recentPayments: any[] = [];

      logger.info({ clientId }, 'Billing summary retrieved successfully');

      return {
        clientId,
        totalInvoicesCents: totalData.totalInvoicesCents,
        openInvoiceBalanceCents: totalData.openInvoiceBalanceCents,
        overdueBalanceCents: overdueData.overdueBalanceCents,
        paidInvoicesCents: totalData.paidInvoicesCents,
        creditBalanceCents,
        invoicesByStatus: {
          draft: statusMap.draft,
          issued: statusMap.issued,
          part_paid: statusMap.part_paid,
          paid: statusMap.paid,
          void: statusMap.void,
        },
        recentInvoices: result.recentInvoices,
        recentPayments,
      };
    } catch (error) {
      logger.error({ error, clientId }, 'Failed to get billing summary');
      throw error;
    }
  }
}

export const billingService = new BillingService();
