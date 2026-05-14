import { Queue, QueueEvents } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const redisUrl = new URL(env.redisUrl);
const queueConnection = {
  host: redisUrl.hostname,
  port: redisUrl.port ? Number(redisUrl.port) : 6379,
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  db: redisUrl.pathname ? Number(redisUrl.pathname.replace('/', '') || 0) : 0,
  tls: redisUrl.protocol === 'rediss:' ? {} : undefined,
};

let subscriptionBillingQueue: Queue | null = null;
let dunningQueue: Queue | null = null;
let morUsageSyncQueue: Queue | null = null;
let pdfQueue: Queue | null = null;
let emailQueue: Queue | null = null;
let subscriptionBillingEvents: QueueEvents | null = null;
let queueEventsRegistered = false;

function ensureQueuesInitialized(): void {
  if (!subscriptionBillingQueue) {
    subscriptionBillingQueue = new Queue('subscriptionBilling', {
      connection: queueConnection,
    });
  }

  if (!dunningQueue) {
    dunningQueue = new Queue('dunning', { connection: queueConnection });
  }

  if (!morUsageSyncQueue) {
    morUsageSyncQueue = new Queue('morUsageSync', { connection: queueConnection });
  }

  if (!pdfQueue) {
    pdfQueue = new Queue('pdf', { connection: queueConnection });
  }

  if (!emailQueue) {
    emailQueue = new Queue('email', { connection: queueConnection });
  }

  if (!subscriptionBillingEvents) {
    subscriptionBillingEvents = new QueueEvents('subscriptionBilling', {
      connection: queueConnection,
    });
  }
}

export function getSubscriptionBillingQueue(): Queue {
  if (!subscriptionBillingQueue) {
    throw new Error('Subscription billing queue is not initialized. Call initializeQueues() first.');
  }

  return subscriptionBillingQueue;
}

function registerQueueEvents(): void {
  if (!env.jobsEnabled || !subscriptionBillingEvents || queueEventsRegistered) {
    return;
  }

  subscriptionBillingEvents.on('completed', ({ jobId }) => {
    logger.info({ jobId }, 'Subscription billing job completed');
  });

  subscriptionBillingEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error({ jobId, failedReason }, 'Subscription billing job failed');
  });

  subscriptionBillingEvents.on('progress', ({ jobId, data }) => {
    logger.info({ jobId, data }, 'Subscription billing job progress');
  });

  queueEventsRegistered = true;
}

export async function initializeQueues(): Promise<void> {
  if (!env.jobsEnabled) {
    logger.info('Queue initialization skipped because JOBS_ENABLED is false');
    return;
  }

  ensureQueuesInitialized();
  registerQueueEvents();
  await getSubscriptionBillingQueue().waitUntilReady();
}

export async function closeQueues(): Promise<void> {
  if (!env.jobsEnabled) {
    return;
  }

  if (subscriptionBillingEvents) {
    await subscriptionBillingEvents.close();
    subscriptionBillingEvents = null;
  }

  if (subscriptionBillingQueue) {
    await subscriptionBillingQueue.close();
    subscriptionBillingQueue = null;
  }

  if (dunningQueue) {
    await dunningQueue.close();
    dunningQueue = null;
  }

  if (morUsageSyncQueue) {
    await morUsageSyncQueue.close();
    morUsageSyncQueue = null;
  }

  if (pdfQueue) {
    await pdfQueue.close();
    pdfQueue = null;
  }

  if (emailQueue) {
    await emailQueue.close();
    emailQueue = null;
  }

  queueEventsRegistered = false;
}

export async function getQueueHealth(): Promise<Record<string, boolean>> {
  if (!env.jobsEnabled) {
    return {
      subscriptionBillingQueue: false,
      dunningQueue: false,
      morUsageSyncQueue: false,
      pdfQueue: false,
      emailQueue: false,
    };
  }

  const result: Record<string, boolean> = {
    subscriptionBillingQueue: false,
    dunningQueue: false,
    morUsageSyncQueue: false,
    pdfQueue: false,
    emailQueue: false,
  };

  ensureQueuesInitialized();

  if (!subscriptionBillingQueue || !dunningQueue || !morUsageSyncQueue || !pdfQueue || !emailQueue) {
    return result;
  }

  try {
    const client = await subscriptionBillingQueue.client;
    await client.ping();
    result.subscriptionBillingQueue = true;
  } catch (error) {
    logger.warn({ error }, 'Subscription billing queue health check failed');
  }

  try {
    const client = await dunningQueue.client;
    await client.ping();
    result.dunningQueue = true;
  } catch (error) {
    logger.warn({ error }, 'Dunning queue health check failed');
  }

  try {
    const client = await morUsageSyncQueue.client;
    await client.ping();
    result.morUsageSyncQueue = true;
  } catch (error) {
    logger.warn({ error }, 'MOR usage sync queue health check failed');
  }

  try {
    const client = await pdfQueue.client;
    await client.ping();
    result.pdfQueue = true;
  } catch (error) {
    logger.warn({ error }, 'PDF queue health check failed');
  }

  try {
    const client = await emailQueue.client;
    await client.ping();
    result.emailQueue = true;
  } catch (error) {
    logger.warn({ error }, 'Email queue health check failed');
  }

  return result;
}

export { queueConnection };
