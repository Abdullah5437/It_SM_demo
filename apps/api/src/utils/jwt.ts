import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtPayload } from '@i-itsm/shared';

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as SignOptions);
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  } as SignOptions);
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.jwtSecret) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Verify and decode refresh token
 */
export function verifyRefreshToken(token: string): { userId: string } {
  try {
    return jwt.verify(token, env.jwtRefreshSecret) as { userId: string };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}
