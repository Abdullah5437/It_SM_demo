import { User } from '../auth/auth.model';
import { UserCreate, UserUpdate } from './schemas';
import { logger } from '../../utils/logger';

export class UsersService {
  /**
   * Create a new user
   */
  async createUser(data: UserCreate) {
    logger.info({ action: 'createUser', data }, 'Creating user');
    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email }).lean();
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await (User as any).hashPassword(data.password);

    const user = new User({
      name: data.name,
      email: data.email,
      passwordHash,
      roles: data.roles || ['user'],
      status: data.status || 'active',
    });

    const saved = await user.save();
    
    logger.info(
      { action: 'create', entity: 'User', id: saved._id, email: saved.email },
      'User created'
    );

    return this.formatUserResponse(saved);
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string) {
    const user = await User.findById(id).lean();
    if (!user) return null;
    return this.formatUserResponse(user);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    const user = await User.findOne({ email }).lean();
    if (!user) return null;
    return this.formatUserResponse(user);
  }

  /**
   * List users with pagination
   */
  async listUsers(filters: any = {}, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const users = await User.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return users.map(user => this.formatUserResponse(user));
  }

  /**
   * Count users
   */
  async countUsers(filters: any = {}): Promise<number> {
    return User.countDocuments(filters);
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: UserUpdate) {
    const updateData: any = { ...data };

    // Hash password if provided
    if (data.password) {
      updateData.passwordHash = await (User as any).hashPassword(data.password);
      delete updateData.password;
    }

    updateData.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (user) {
      logger.info(
        { action: 'update', entity: 'User', id, data },
        'User updated'
      );
    }

    return user ? this.formatUserResponse(user) : null;
  }

  /**
   * Delete user
   */
  async deleteUser(id: string) {
    const user = await User.findByIdAndDelete(id).lean();

    if (user) {
      logger.info(
        { action: 'delete', entity: 'User', id },
        'User deleted'
      );
    }

    return user ? this.formatUserResponse(user) : null;
  }

  /**
   * Format user response (remove sensitive fields)
   */
  private formatUserResponse(user: any) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}

export default new UsersService();
