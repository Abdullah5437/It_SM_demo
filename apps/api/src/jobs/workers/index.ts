import { Worker } from 'bullmq';
import { ScheduledTask } from 'node-cron';
import { createSubscriptionBillingWorker } from './subscriptionBillingWorker';
import startScheduledSubscriptionTrigger from './scheduledSubscriptionTrigger';
import { initializeQueues } from '../queues';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';

let subscriptionBillingWorker: Worker | null = null;
let scheduledTrigger: ScheduledTask | null = null;

export async function startWorkers(): Promise<void> {
  if (!env.jobsEnabled) {
    logger.info('Worker startup skipped because JOBS_ENABLED is false');
    return;
  }

  await initializeQueues();

  subscriptionBillingWorker = createSubscriptionBillingWorker();
  subscriptionBillingWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Subscription billing worker completed job');
  });
  subscriptionBillingWorker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error }, 'Subscription billing worker failed job');
  });

  scheduledTrigger = startScheduledSubscriptionTrigger();
  logger.info('Scheduled subscription billing trigger started');
}

export async function stopWorkers(): Promise<void> {
  if (!env.jobsEnabled) {
    return;
  }

  if (scheduledTrigger) {
    scheduledTrigger.stop();
    scheduledTrigger = null;
  }

  if (subscriptionBillingWorker) {
    await subscriptionBillingWorker.close();
    subscriptionBillingWorker = null;
  }
}
