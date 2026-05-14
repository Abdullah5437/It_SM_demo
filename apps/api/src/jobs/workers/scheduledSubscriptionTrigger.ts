import cron from 'node-cron';
import subscriptionService from '../../modules/subscriptions/subscription.service';
import { ServicePlanModel } from '../../modules/catalog/servicePlan.model';
import { enqueueSubscriptionBilling } from './subscriptionBillingWorker';
import { logger } from '../../utils/logger';

export function startScheduledSubscriptionTrigger(): cron.ScheduledTask {
  const task = cron.schedule('0 2 * * *', async () => {
    try {
      const dueSubscriptions = await subscriptionService.getDueSubscriptions();

      for (const subscription of dueSubscriptions) {
        const servicePlan = await ServicePlanModel.findById(subscription.servicePlanId);
        if (!servicePlan) {
          logger.warn({ subscriptionId: subscription._id }, 'Service plan missing for subscription');
          continue;
        }

        const periodStart = subscription.nextInvoiceDate;
        const periodEnd = subscriptionService.calculateNextInvoiceDate(
          subscription.nextInvoiceDate,
          servicePlan.billingCycle
        );

        const jobId = await enqueueSubscriptionBilling(subscription._id.toString(), {
          startDate: periodStart,
          endDate: periodEnd,
        });

        logger.info({ subscriptionId: subscription._id, jobId }, 'Enqueued subscription billing job');
      }
    } catch (error) {
      logger.error({ error }, 'Failed to enqueue subscription billing jobs');
    }
  });

  return task;
}

export default startScheduledSubscriptionTrigger;
