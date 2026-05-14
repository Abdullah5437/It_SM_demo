import { Job, Worker } from 'bullmq';
import crypto from 'crypto';
import { getSubscriptionBillingQueue, queueConnection } from '../queues';
import subscriptionService from '../../modules/subscriptions/subscription.service';
import subscriptionBillingService from '../../modules/subscriptions/subscriptionBilling.service';
import { invoiceService } from '../../modules/billing/invoice.service';
import { ServicePlanModel } from '../../modules/catalog/servicePlan.model';
import Subscription from '../../modules/subscriptions/subscription.model';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { writeAudit } from '../../middlewares/audit';
import { SubscriptionBillingJob } from '@i-itsm/shared';

function createJobHash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

async function processSubscriptionBilling(subscriptionId: string): Promise<void> {
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  const servicePlan = await ServicePlanModel.findById(subscription.servicePlanId);
  if (!servicePlan) {
    throw new Error('Service plan not found');
  }

  const invoiceLines = await subscriptionBillingService.calculateSubscriptionInvoiceLines(subscription);

  const invoice = await invoiceService.createInvoice(
    subscription.clientId.toString(),
    invoiceLines,
    subscription.nextInvoiceDate,
    subscription.currency,
    env.systemUserId
  );

  await invoiceService.issueInvoice(invoice._id.toString());

  const nextInvoiceDate = subscriptionService.calculateNextInvoiceDate(
    subscription.nextInvoiceDate,
    servicePlan.billingCycle
  );

  const updates: Record<string, unknown> = {
    nextInvoiceDate,
  };

  if (subscription.renewalDate && subscription.renewalDate <= new Date()) {
    updates.status = 'expired';
  }

  const before = subscription.toObject();
  const updated = await Subscription.findByIdAndUpdate(subscription._id, updates, { new: true });

  if (updated) {
    await writeAudit({
      action: 'update',
      entityType: 'Subscription',
      entityId: updated._id.toString(),
      before: before as unknown as Record<string, unknown>,
      after: updated.toObject() as unknown as Record<string, unknown>,
      userId: env.systemUserId,
    });
  }
}

export function createSubscriptionBillingWorker(): Worker<SubscriptionBillingJob> {
  const subscriptionBillingQueue = getSubscriptionBillingQueue();

  return new Worker<SubscriptionBillingJob>(
    subscriptionBillingQueue.name,
    async (job: Job<SubscriptionBillingJob>) => {
      const { subscriptionId } = job.data || {};

      if (subscriptionId) {
        await processSubscriptionBilling(subscriptionId);
        return;
      }

      const dueSubscriptions = await subscriptionService.getDueSubscriptions();
      for (const subscription of dueSubscriptions) {
        await processSubscriptionBilling(subscription._id.toString());
      }
    },
    {
      connection: queueConnection,
      concurrency: 5,
    }
  );
}

export function createSubscriptionJobId(subscriptionId: string, period?: { startDate: Date; endDate: Date }): string {
  const base = `${subscriptionId}:${period?.startDate?.toISOString() ?? 'na'}:${period?.endDate?.toISOString() ?? 'na'}`;
  return `subscriptionBilling:${createJobHash(base)}`;
}

export function enqueueSubscriptionBilling(subscriptionId?: string, period?: { startDate: Date; endDate: Date }): Promise<string> {
  if (!env.jobsEnabled) {
    logger.info('Skipping enqueue because JOBS_ENABLED is false');
    return Promise.resolve('jobs-disabled');
  }

  const subscriptionBillingQueue = getSubscriptionBillingQueue();
  const jobId = subscriptionId ? createSubscriptionJobId(subscriptionId, period) : undefined;
  return subscriptionBillingQueue.add(
    'subscriptionBilling',
    { subscriptionId, period },
    {
      jobId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  ).then((job) => job.id as string);
}

export default createSubscriptionBillingWorker;
