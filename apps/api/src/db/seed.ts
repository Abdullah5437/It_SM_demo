import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDatabase } from '../config/db';
import { User } from '../modules/auth/auth.model';
import { logger } from '../utils/logger';

/**
 * Database seed script
 * Usage: npm run db:seed
 */
async function seed(): Promise<void> {
  try {
    logger.info('Starting database seed...');

    // Connect to MongoDB Atlas via env.MONGO_URI
    await connectDatabase();

    logger.info('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    logger.info('Cleared existing users');

    // Helper to hash passwords
    const hashPassword = (password: string) =>
      bcrypt.hashSync(password, 10);

    // Admin user
    const admin = await User.create({
      email: 'admin@techline.local',
      passwordHash: hashPassword('admin@123'),
      name: 'Admin User',
      roles: ['admin'],
      status: 'active',
    });

    logger.info('Created admin user', { email: admin.email });

    // Sample user
    const user = await User.create({
      email: 'user@techline.local',
      passwordHash: hashPassword('user@123'),
      name: 'Sample User',
      roles: ['user'],
      status: 'active',
    });

    logger.info('Created sample user', { email: user.email });

    // Accounts user
    const accountsUser = await User.create({
      email: 'accounts@techline.local',
      passwordHash: hashPassword('accounts@123'),
      name: 'Accounts Manager',
      roles: ['accounts'],
      status: 'active',
    });

    logger.info('Created accounts user', { email: accountsUser.email });

    logger.info('Database seed completed successfully!');
  } catch (error) {
    logger.error('Database seed failed', { error });
    process.exitCode = 1;
  } finally {
    // Always close DB connection
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  }
}

// Run only if executed directly
if (require.main === module) {
  seed();
}

export default seed;