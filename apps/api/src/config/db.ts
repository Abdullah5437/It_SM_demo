import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';
// 2aKvizKV9dk67ggj   abdulazmifsd_db_user
export async function connectDatabase(): Promise<void> {
  try {
    const mongoUri = env.mongoUri || 'mongodb+srv://abdulazmifsd_db_user:2aKvizKV9dk67ggj@firstitsm.jdqyx2c.mongodb.net/?appName=firstitsm';
    
    await mongoose.connect(mongoUri);

    logger.info('MongoDB connected successfully');

    // Create indexes
    await createIndexes();
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Failed to disconnect from MongoDB', { error });
    throw error;
  }
}

async function createIndexes(): Promise<void> {
  // Indexes will be created by individual models
  logger.info('Database indexes created');
}

export default mongoose;
