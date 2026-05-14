import { createClient } from 'redis';
import { env } from './env';
import { logger } from '../utils/logger';

let redisClient: ReturnType<typeof createClient> | null = null;

export async function connectRedis(): Promise<ReturnType<typeof createClient>> {
  if (!env.jobsEnabled) {
    logger.info('Redis connection skipped because JOBS_ENABLED is false');
    return null as unknown as ReturnType<typeof createClient>;
  }

  try {
    const client = createClient({
      url: env.redisUrl,
    });

    client.on('error', (err) => logger.error('Redis error:', { error: err }));
    client.on('connect', () => logger.info('Redis connected'));

    await client.connect();
    redisClient = client;

    return client;
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
    throw error;
  }
}

export function getRedisClient(): ReturnType<typeof createClient> {
  if (!env.jobsEnabled) {
    throw new Error('Redis is disabled in this environment (JOBS_ENABLED=false).');
  }

  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
    logger.info('Redis disconnected');
  }
}

export default { connectRedis, getRedisClient, disconnectRedis };
