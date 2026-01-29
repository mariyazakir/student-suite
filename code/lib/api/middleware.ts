/**
 * API Middleware
 * 
 * Common middleware functions for API routes.
 * Handles authentication, error handling, and request validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, UnauthorizedError } from './errors';
import { logger } from '@/lib/logging/logger';
import { verifyAuthToken, type AuthTokenPayload } from '@/lib/auth/jwt';

/**
 * Get auth context from request (JWT bearer token)
 */
export async function getAuthContextFromRequest(
  request: NextRequest
): Promise<AuthTokenPayload | null> {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return null;
  }

  try {
    return await verifyAuthToken(token);
  } catch (error) {
    return null;
  }
}

/**
 * Require authentication middleware
 */
export async function requireAuth(request: NextRequest): Promise<string> {
  const authContext = await getAuthContextFromRequest(request);

  if (!authContext?.sub) {
    throw new UnauthorizedError('Authentication required');
  }

  return authContext.sub;
}

export async function requireAuthContext(
  request: NextRequest
): Promise<AuthTokenPayload> {
  const authContext = await getAuthContextFromRequest(request);

  if (!authContext?.sub) {
    throw new UnauthorizedError('Authentication required');
  }

  return authContext;
}

/**
 * API route handler wrapper with error handling
 */
export function withErrorHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      logger.error({
        message: 'API request failed',
        context: {
          method: request.method,
          url: request.url,
        },
        error,
      });
      const errorResponse = createErrorResponse(error);
      return NextResponse.json(
        { error: errorResponse.body },
        { status: errorResponse.status }
      );
    }
  };
}

/**
 * Parse JSON body with error handling
 */
export async function parseJSONBody<T>(request: NextRequest): Promise<T> {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}
