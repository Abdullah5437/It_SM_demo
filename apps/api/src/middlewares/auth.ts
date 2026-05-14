import { Request, Response, NextFunction } from 'express';
import { AuthError } from '@i-itsm/shared';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        roles: string[];
      };
    }
  }
}

/**
 * JWT Authentication Middleware
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    // Validate Authorization Header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('Missing or invalid authorization header');
    }

    // Extract Token
    const token = authHeader.substring(7);

    // Verify JWT
    const payload = verifyAccessToken(token);

    // Attach User to Request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      roles: payload.roles,
    };

    logger.info('Authentication successful', {
      userId: req.user.userId,
    });

    next();
  } catch (error) {
    logger.warn('Authentication failed', { error });

    throw new AuthError('Invalid or expired token');
  }
}

/**
 * Signup Passkey Middleware
 */
export function validateSignupKey(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const signupKey = req.headers['x-signup-key'];
    logger.info('HEADER KEY', {
     signupKey: signupKey,
    });
      logger.info('ENV KEY', {
    key: process.env.ADMIN_SIGNUP_KEY,
    });
    

    // Check if key exists
    if (!signupKey || typeof signupKey !== 'string') {
      throw new AuthError('Signup key is required');
    }

    // Validate key
    if (signupKey !== process.env.ADMIN_SIGNUP_KEY) {
      throw new AuthError('Invalid signup key');
    }

    logger.info('Signup key validated');

    next();
  } catch (error) {
    logger.warn('Signup key validation failed', { error });

    throw new AuthError('Unauthorized signup attempt');
  }
}

export default authenticate;

// Aliases
export const authenticateJWT = authenticate;