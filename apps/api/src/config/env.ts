import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const ENV_FILE_CANDIDATES = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`),
  path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}.local`),
  path.resolve(__dirname, '../../../../.env'),
  path.resolve(__dirname, '../../../../.env.local'),
  path.resolve(__dirname, `../../../../.env.${process.env.NODE_ENV}`),
  path.resolve(__dirname, `../../../../.env.${process.env.NODE_ENV}.local`),
  path.resolve(process.cwd(), '.env.example'),
  path.resolve(__dirname, '../../../../.env.example'),
];

const envFile = ENV_FILE_CANDIDATES.find(filePath => fs.existsSync(filePath));
if (envFile) {
  dotenv.config({ path: envFile });
  if (envFile.endsWith('.env.example')) {
    console.warn(
      `Loaded environment variables from ${envFile}. Copy this file to .env for a proper local configuration.`
    );
  }
} else {
  dotenv.config();
}

export const env = {
  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:4000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Database
  mongoUri: process.env.MONGO_URI || 'mongodb+srv://abdulazmifsd_db_user:2aKvizKV9dk67ggj@firstitsm.jdqyx2c.mongodb.net/?appName=firstitsm',
  mongoUser: process.env.MONGO_USER || 'admin',
  mongoPassword: process.env.MONGO_PASSWORD || 'admin',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379/0',
  jobsEnabled:
    process.env.JOBS_ENABLED !== undefined
      ? process.env.JOBS_ENABLED === 'true'
      : process.env.NODE_ENV !== 'development',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Email
  emailProvider: (process.env.EMAIL_PROVIDER || 'smtp') as 'sendgrid' | 'mailgun' | 'smtp',
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  mailgunApiKey: process.env.MAILGUN_API_KEY,
  mailgunDomain: process.env.MAILGUN_DOMAIN,
  smtpHost: process.env.SMTP_HOST || 'localhost',
  smtpPort: parseInt(process.env.SMTP_PORT || '1025', 10),
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  fromEmail: process.env.FROM_EMAIL || 'noreply@techline.local',
  fromName: process.env.FROM_NAME || 'Tech Line ITSM',

  // Storage (S3/R2)
  s3Region: process.env.S3_REGION || 'auto',
  s3Bucket: process.env.S3_BUCKET || 'i-itsm-files',
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  s3Endpoint: process.env.S3_ENDPOINT,

  // MOR (VoIP)
  morBaseUrl: process.env.MOR_BASE_URL || 'https://mor.example.com',
  morAuthType: (process.env.MOR_AUTH_TYPE || 'api_key') as 'api_key' | 'basic' | 'token',
  morApiKey: process.env.MOR_API_KEY,
  morUsername: process.env.MOR_USERNAME,
  morPassword: process.env.MOR_PASSWORD,
  morTimeoutMs: parseInt(process.env.MOR_TIMEOUT_MS || '30000', 10),
  morRetryCount: parseInt(process.env.MOR_RETRY_COUNT || '3', 10),
  useMorMock: process.env.USE_MOR_MOCK === 'true',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug',
  logFormat: process.env.LOG_FORMAT || 'json',

  // Background jobs
  systemUserId: process.env.SYSTEM_USER_ID || '000000000000000000000000',

  // Features
  enableAuditLogging: process.env.ENABLE_AUDIT_LOGGING !== 'false',
  enableWebhooks: process.env.ENABLE_WEBHOOKS !== 'false',
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'EUR',
  defaultTaxRateBps: parseInt(process.env.DEFAULT_TAX_RATE_BPS || '2100', 10), // 21% = 2100 bps

  // Derived
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

/**
 * Validate required environment variables
 */
export function validateEnv(): void {
  const required = ['MONGO_URI', 'JWT_SECRET'];

  if (env.jobsEnabled) {
    required.push('REDIS_URL');
  }

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
