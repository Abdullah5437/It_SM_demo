import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '@i-itsm/shared';
import { logger } from '../utils/logger';

/**
 * Middleware to validate request body against a Zod schema
 */
export function validateRequest(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: unknown) {
      logger.warn('Validation error', { error });
      
      if (error instanceof Error && 'issues' in error) {
        const issues = (error as any).issues || [];
        const details = issues.reduce((acc: Record<string, string>, issue: any) => {
          const path = issue.path.join('.');
          acc[path] = issue.message;
          return acc;
        }, {});
        
        throw new ValidationError('Validation failed', details);
      }
      
      throw new ValidationError('Invalid request body');
    }
  };
}

export default validateRequest;
