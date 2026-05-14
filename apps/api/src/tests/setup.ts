// Jest setup file for tests
import { config } from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

// Load test environment variables (prefer repo root .env.test)
const envPath = path.resolve(__dirname, '../../../../.env.test');
config({ path: envPath });

// Allow slower in-memory Mongo startup (first run downloads Mongo binary)
jest.setTimeout(180000);

const mongoUri = process.env.TEST_MONGO_URI || process.env.MONGO_URI;

beforeAll(async () => {
  if (!mongoUri) {
    throw new Error('Set TEST_MONGO_URI (recommended) or MONGO_URI to run tests against MongoDB Atlas.');
  }

  await mongoose.connect(mongoUri, {
    dbName: process.env.TEST_DB_NAME || 'test',
    serverSelectionTimeoutMS: 30000,
  });

  // Register minimal stub models used only for population in tests
  if (!mongoose.models.Client) {
    mongoose.model('Client', new mongoose.Schema({ name: String }));
  }
  if (!mongoose.models.ClientSite) {
    mongoose.model('ClientSite', new mongoose.Schema({ name: String }));
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
});

// Mock Redis for tests
jest.mock('../config/redis', () => ({
  connectRedis: jest.fn(),
  getRedisClient: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  })),
  disconnectRedis: jest.fn(),
}));
