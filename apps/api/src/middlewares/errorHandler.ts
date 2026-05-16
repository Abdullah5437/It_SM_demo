import { Request, Response, NextFunction } from 'express';
import { AppError } from '@i-itsm/shared';
import { logger } from '../utils/logger';

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: Error | AppError | any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Mongoose & shared Validation Errors
  if (error.name === 'ValidationError' && error.statusCode === undefined) {
    const messages: string[] = [];
    if (error.errors) {
      for (const key of Object.keys(error.errors)) {
        messages.push(error.errors[key].message);
      }
    }
    const details = error.errors || {};
    res.status(400).json({
      success: false,
      error: 'Validation failed: ' + messages.join(', '),
      code: 'VALIDATION_ERROR',
      details,
    });
    return;
  }

  // Mongoose Cast Error (invalid ObjectId, etc.)
  if (error.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: `Invalid value for ${error.path}: ${error.value}`,
      code: 'INVALID_ID',
    });
    return;
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {}).join(', ');
    res.status(409).json({
      success: false,
      error: `Duplicate value for: ${field}`,
      code: 'DUPLICATE_KEY',
    });
    return;
  }

  // Determine status code and response
  if (error instanceof AppError) {
    const details = error.details || {};
    const messages: string[] = [];
    if (typeof details === 'object' && Object.keys(details).length > 0) {
      for (const [field, msg] of Object.entries(details)) {
        messages.push(`${field}: ${msg}`);
      }
    }
    res.status(error.statusCode).json({
      success: false,
      error: messages.length > 0 ? `Validation failed: ${messages.join(', ')}` : error.message,
      code: error.code,
      details,
    });
  } else {
    // Generic error
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
}

export default errorHandler;