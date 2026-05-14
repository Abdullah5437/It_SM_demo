import mongoose from 'mongoose';
import { SubscriptionDocument } from './subscription.model';
import { ServicePlanModel } from '../catalog/servicePlan.model';
import { ServiceAddonModel } from '../catalog/serviceAddon.model';
import { InvoiceLineItem } from '../billing/invoice.model';
import { env } from '../../config/env';

export type InvoiceLine = InvoiceLineItem;

export interface InvoiceCalculation {
  lines: InvoiceLine[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
}

class SubscriptionBillingService {
  async calculateSubscriptionInvoiceLines(subscription: SubscriptionDocument): Promise<InvoiceLine[]> {
    const lines: InvoiceLine[] = [];

    // Fetch service plan details for description
    const servicePlan = await ServicePlanModel.findById(subscription.servicePlanId);
    if (!servicePlan) {
      throw new Error('Service plan not found');
    }

    // Base subscription line
    const baseLineTotal = subscription.quantity * subscription.unitPriceCents;
    lines.push({
      lineNo: 1,
      itemType: 'service',
      description: servicePlan.name,
      qty: subscription.quantity,
      unitPriceCents: subscription.unitPriceCents,
      taxRateBps: env.defaultTaxRateBps,
      lineTotalCents: baseLineTotal,
      servicePlanId: new mongoose.Types.ObjectId(subscription.servicePlanId),
      subscriptionId: new mongoose.Types.ObjectId(subscription._id),
    });

    // Addon lines
    let lineNo = 2;
    for (const addon of subscription.addonItems) {
      const addonDetails = await ServiceAddonModel.findById(addon.addonId);
      if (addonDetails) {
        const addonLineTotal = addon.quantity * addon.unitPriceCents;
        lines.push({
          lineNo,
          itemType: 'addon',
          description: addonDetails.name,
          qty: addon.quantity,
          unitPriceCents: addon.unitPriceCents,
          taxRateBps: env.defaultTaxRateBps,
          lineTotalCents: addonLineTotal,
          serviceAddonId: new mongoose.Types.ObjectId(addon.addonId),
          subscriptionId: new mongoose.Types.ObjectId(subscription._id),
        });
        lineNo += 1;
      }
    }

    return lines;
  }

  calculateInvoiceTotals(lines: InvoiceLine[]): {
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
  } {
    let subtotalCents = 0;
    let taxCents = 0;

    for (const line of lines) {
      subtotalCents += line.lineTotalCents;

      if (line.taxRateBps) {
        const lineTaxCents = Math.round((line.lineTotalCents * line.taxRateBps) / 10000);
        taxCents += lineTaxCents;
      }
    }

    return {
      subtotalCents,
      taxCents,
      totalCents: subtotalCents + taxCents,
    };
  }

  async calculateSubscriptionInvoice(
    subscription: SubscriptionDocument
  ): Promise<InvoiceCalculation> {
    const lines = await this.calculateSubscriptionInvoiceLines(subscription);
    const totals = this.calculateInvoiceTotals(lines);

    return {
      lines,
      ...totals,
    };
  }

  calculateNextInvoiceDate(fromDate: Date, billingCycle: string): Date {
    const nextDate = new Date(fromDate);

    switch (billingCycle) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'annual':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case 'one_time':
        break;
      default:
        throw new Error(`Unknown billing cycle: ${billingCycle}`);
    }

    return nextDate;
  }

  calculateProrationCredit(
    subscription: SubscriptionDocument,
    oldQuantity: number,
    newQuantity: number,
    oldPrice: number,
    newPrice: number,
    daysUsed: number,
    totalDaysInPeriod: number
  ): {
    creditCents: number;
    adjustmentCents: number;
  } {
    const oldPeriodCost = oldQuantity * oldPrice;
    const newPeriodCost = newQuantity * newPrice;

    // Calculate pro-rata amount for used days
    const oldProRataCents = Math.round((oldPeriodCost * daysUsed) / totalDaysInPeriod);
    const newProRataCents = Math.round((newPeriodCost * daysUsed) / totalDaysInPeriod);

    const creditCents = oldProRataCents; // Credit the full period amount
    const adjustmentCents = newProRataCents - oldProRataCents; // Adjustment for next invoice

    return {
      creditCents,
      adjustmentCents,
    };
  }

  getProrationPercentage(startDate: Date, endDate: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    const daysUsed = Math.ceil((new Date().getTime() - startDate.getTime()) / oneDay);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / oneDay);

    return totalDays > 0 ? daysUsed / totalDays : 1;
  }
}

export default new SubscriptionBillingService();
