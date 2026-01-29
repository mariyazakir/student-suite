/**
 * API Error Handling
 * 
 * Standardized error responses for API routes.
 * Provides consistent error format across all endpoints.
 */

import type { APIError } from '@/types';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON(): APIError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

// Predefined error classes
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      'NOT_FOUND',
      `${resource} not found${id ? `: ${id}` : ''}`,
      404
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super('RATE_LIMIT_EXCEEDED', message, 429);
  }
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: ZodError): ValidationError {
  const details: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(err.message);
  });

  return new ValidationError('Validation failed', details);
}

/**
 * Create standardized API error response
 */
export function createErrorResponse(error: unknown): {
  status: number;
  body: APIError;
} {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: error.toJSON(),
    };
  }

  if (error instanceof ZodError) {
    const validationError = handleZodError(error);
    return {
      status: validationError.statusCode,
      body: validationError.toJSON(),
    };
  }

  // Unknown error
  console.error('Unhandled error:', error);
  
  return {
    status: 500,
    body: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  };
}
