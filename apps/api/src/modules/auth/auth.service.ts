import bcryptjs from 'bcryptjs';
import { AuthError } from '@i-itsm/shared';
import { User } from './auth.model';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';

export class AuthService {
  /**
   * Login user
   */
  async login(email: string, password: string) {
    const user = await User.findOne({ email }).lean();

    if (!user) {
      throw new AuthError('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new AuthError('User account is not active');
    }

    const isPasswordValid = await bcryptjs.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AuthError('Invalid email or password');
    }

    // Update last login
    await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles,
    });

    const refreshToken = generateRefreshToken(user._id.toString());

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string) {
    if (!refreshToken) {
      throw new AuthError('Refresh token required');
    }

    try {
      // Verify refresh token (simplified - use jwt.verify in production)
      const decoded = require('jsonwebtoken').verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret'
      );

      const user = await User.findById(decoded.userId).lean();

      if (!user || user.status !== 'active') {
        throw new AuthError('User not found or inactive');
      }

      // Generate new tokens
      const accessToken = generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
        roles: user.roles,
      });

      const newRefreshToken = generateRefreshToken(user._id.toString());

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60,
      };
    } catch (error) {
      throw new AuthError('Invalid refresh token');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await User.findById(userId).select('-passwordHash').lean();

    if (!user) {
      throw new AuthError('User not found');
    }

    return user;
  }

  /**
   * Create user (for admin/seeding)
   */
  async createUser(
    email: string,
    password: string,
    name: string,
    roles: string[] = ['user']
  ) {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new AuthError('User with this email already exists');
    }

    const passwordHash = await bcryptjs.hash(password, 10);

    const user = new User({
      email,
      passwordHash,
      name,
      roles,
      status: 'active',
    });

    await user.save();

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      roles: user.roles,
    };
  }
}

