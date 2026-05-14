import mongoose from 'mongoose';
import Subscription, { SubscriptionDocument } from './subscription.model';
import { ServicePlanModel } from '../catalog/servicePlan.model';
import { writeAudit } from '../../middlewares/audit';

export interface CreateSubscriptionInput {
  clientId: string;
  clientSiteId?: string;
  servicePlanId: string;
  quantity: number;
  unitPriceCents?: number;
  addonItems?: Array<{ addonId: string; quantity: number; unitPriceCents: number }>;
  startDate: Date;
  notes?: string;
  currency?: string;
}

export interface UpdateSubscriptionInput {
  quantity?: number;
  unitPriceCents?: number;
  addonItems?: Array<{ addonId: string; quantity: number; unitPriceCents: number }>;
  notes?: string;
}

export interface BillingCycle {
  value: number;
  unit: 'days' | 'months' | 'years';
}

class SubscriptionService {
  async createSubscription(
    input: CreateSubscriptionInput,
    userId?: string,
    requestIp?: string
  ): Promise<SubscriptionDocument> {
    try {
      // Fetch service plan to get billing cycle
      const servicePlan = await ServicePlanModel.findById(input.servicePlanId);
      if (!servicePlan) {
        throw new Error('Service plan not found');
      }

      const startDate = new Date(input.startDate);
      const nextInvoiceDate = this.calculateNextInvoiceDate(startDate, servicePlan.billingCycle);
      const renewalDate = this.calculateRenewalDate(startDate, servicePlan.billingCycle);

      const subscription = new Subscription({
        clientId: new mongoose.Types.ObjectId(input.clientId),
        clientSiteId: input.clientSiteId
          ? new mongoose.Types.ObjectId(input.clientSiteId)
          : undefined,
        servicePlanId: new mongoose.Types.ObjectId(input.servicePlanId),
        quantity: input.quantity,
        unitPriceCents: input.unitPriceCents ?? servicePlan.basePriceCents,
        currency: input.currency ?? servicePlan.currency ?? 'USD',
        status: 'active',
        startDate,
        nextInvoiceDate,
        renewalDate,
        addonItems: (input.addonItems ?? []).map((addon) => ({
          addonId: new mongoose.Types.ObjectId(addon.addonId),
          quantity: addon.quantity,
          unitPriceCents: addon.unitPriceCents,
        })),
        notes: input.notes,
      });

      const saved = await subscription.save();
      await writeAudit({
        action: 'create',
        entityType: 'Subscription',
        entityId: saved._id.toString(),
        after: saved.toObject() as unknown as Record<string, unknown>,
        userId,
        ip: requestIp,
      });
      return saved;
    } catch (error) {
      throw error;
    }
  }

  async getSubscription(subscriptionId: string): Promise<SubscriptionDocument | null> {
    return Subscription.findById(subscriptionId)
      .populate('clientId')
      .populate('servicePlanId');
  }

  async updateSubscription(
    subscriptionId: string,
    input: UpdateSubscriptionInput,
    userId?: string,
    requestIp?: string
  ): Promise<SubscriptionDocument | null> {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const before = subscription.toObject();

    // Only allow updates on active/trial/paused subscriptions
    if (!['active', 'trial', 'paused'].includes(subscription.status)) {
      throw new Error(`Cannot update subscription with status: ${subscription.status}`);
    }

    const updates: any = {};

    if (input.quantity !== undefined) {
      updates.quantity = input.quantity;
    }

    if (input.unitPriceCents !== undefined) {
      updates.unitPriceCents = input.unitPriceCents;
    }

    if (input.addonItems !== undefined) {
      updates.addonItems = input.addonItems.map((addon) => ({
        addonId: new mongoose.Types.ObjectId(addon.addonId),
        quantity: addon.quantity,
        unitPriceCents: addon.unitPriceCents,
      }));
    }

    if (input.notes !== undefined) {
      updates.notes = input.notes;
    }

    // Recalculate nextInvoiceDate if quantity or price changed
    if (input.quantity !== undefined || input.unitPriceCents !== undefined) {
      const servicePlan = await ServicePlanModel.findById(subscription.servicePlanId);
      if (servicePlan) {
        updates.nextInvoiceDate = this.calculateNextInvoiceDate(
          subscription.nextInvoiceDate,
          servicePlan.billingCycle
        );
      }
    }

    const updated = await Subscription.findByIdAndUpdate(subscriptionId, updates, { new: true });
    if (updated) {
      await writeAudit({
        action: 'update',
        entityType: 'Subscription',
        entityId: updated._id.toString(),
        before: before as unknown as Record<string, unknown>,
        after: updated.toObject() as unknown as Record<string, unknown>,
        userId,
        ip: requestIp,
      });
    }
    return updated;
  }

  async pauseSubscription(
    subscriptionId: string,
    userId?: string,
    requestIp?: string
  ): Promise<SubscriptionDocument | null> {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const before = subscription.toObject();

    if (!['active', 'trial'].includes(subscription.status)) {
      throw new Error(`Cannot pause subscription with status: ${subscription.status}`);
    }

    const updated = await Subscription.findByIdAndUpdate(
      subscriptionId,
      { status: 'paused' },
      { new: true }
    );
    if (updated) {
      await writeAudit({
        action: 'update',
        entityType: 'Subscription',
        entityId: updated._id.toString(),
        before: before as unknown as Record<string, unknown>,
        after: updated.toObject() as unknown as Record<string, unknown>,
        userId,
        ip: requestIp,
      });
    }
    return updated;
  }

  async resumeSubscription(
    subscriptionId: string,
    userId?: string,
    requestIp?: string
  ): Promise<SubscriptionDocument | null> {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const before = subscription.toObject();

    if (subscription.status !== 'paused') {
      throw new Error(`Cannot resume subscription with status: ${subscription.status}`);
    }

    const updated = await Subscription.findByIdAndUpdate(
      subscriptionId,
      { status: 'active' },
      { new: true }
    );
    if (updated) {
      await writeAudit({
        action: 'update',
        entityType: 'Subscription',
        entityId: updated._id.toString(),
        before: before as unknown as Record<string, unknown>,
        after: updated.toObject() as unknown as Record<string, unknown>,
        userId,
        ip: requestIp,
      });
    }
    return updated;
  }

  async cancelSubscription(
    subscriptionId: string,
    userId?: string,
    requestIp?: string
  ): Promise<SubscriptionDocument | null> {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const before = subscription.toObject();

    const updated = await Subscription.findByIdAndUpdate(
      subscriptionId,
      {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
      { new: true }
    );
    if (updated) {
      await writeAudit({
        action: 'update',
        entityType: 'Subscription',
        entityId: updated._id.toString(),
        before: before as unknown as Record<string, unknown>,
        after: updated.toObject() as unknown as Record<string, unknown>,
        userId,
        ip: requestIp,
      });
    }
    return updated;
  }

  async listSubscriptions(
    filters?: {
      clientId?: string;
      status?: string;
      limit?: number;
      skip?: number;
    }
  ): Promise<SubscriptionDocument[]> {
    const query: any = {};

    if (filters?.clientId) {
      query.clientId = new mongoose.Types.ObjectId(filters.clientId);
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    const limit = filters?.limit ?? 50;
    const skip = filters?.skip ?? 0;

    return Subscription.find(query)
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });
  }

  async getDueSubscriptions(): Promise<SubscriptionDocument[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Subscription.find({
      status: 'active',
      nextInvoiceDate: { $lte: today },
    });
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

  calculateRenewalDate(startDate: Date, billingCycle: string): Date {
    const renewalDate = new Date(startDate);

    switch (billingCycle) {
      case 'monthly':
      case 'quarterly':
      case 'annual':
        renewalDate.setFullYear(renewalDate.getFullYear() + 1);
        break;
      case 'one_time':
        renewalDate.setFullYear(renewalDate.getFullYear() + 1);
        break;
      default:
        throw new Error(`Unknown billing cycle: ${billingCycle}`);
    }

    return renewalDate;
  }

  async updateSubscriptionNextInvoiceDate(
    subscriptionId: string,
    billingCycle: string
  ): Promise<SubscriptionDocument | null> {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const nextInvoiceDate = this.calculateNextInvoiceDate(
      subscription.nextInvoiceDate,
      billingCycle
    );

    return Subscription.findByIdAndUpdate(
      subscriptionId,
      { nextInvoiceDate },
      { new: true }
    );
  }

  async getSubscriptionSummary(clientId: string): Promise<{
    activeSubscriptions: number;
    totalMonthlyRecurringCents: number;
    trialSubscriptions: number;
    expiringSoonCount: number;
    subscriptions: SubscriptionDocument[];
  }> {
    const clientObjectId = new mongoose.Types.ObjectId(clientId);

    // Get all subscriptions for the client
    const subscriptions = await Subscription.find({
      clientId: clientObjectId,
      status: { $in: ['active', 'trial', 'paused'] },
    });

    const activeSubscriptions = subscriptions.filter((s) => s.status === 'active').length;
    const trialSubscriptions = subscriptions.filter((s) => s.status === 'trial').length;

    // Calculate total monthly recurring (base + addons for active only)
    const totalMonthlyRecurringCents = subscriptions
      .filter((s) => s.status === 'active')
      .reduce((total, sub) => {
        const basePrice = sub.quantity * sub.unitPriceCents;
        const addonsPrice = sub.addonItems.reduce(
          (addonTotal, addon) => addonTotal + addon.quantity * addon.unitPriceCents,
          0
        );
        return total + basePrice + addonsPrice;
      }, 0);

    // Count subscriptions expiring within 30 days
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringSoonCount = subscriptions.filter(
      (s) => s.renewalDate >= today && s.renewalDate <= thirtyDaysFromNow
    ).length;

    return {
      activeSubscriptions,
      totalMonthlyRecurringCents,
      trialSubscriptions,
      expiringSoonCount,
      subscriptions,
    };
  }
}

export default new SubscriptionService();
