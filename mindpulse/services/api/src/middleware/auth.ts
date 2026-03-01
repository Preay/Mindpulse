import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../utils/auth';
import { JWTPayload } from '@mindpulse/shared-types';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

export async function authenticateToken(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
        statusCode: 401,
      });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
      return reply.status(401).send({
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
        statusCode: 401,
      });
    }

    request.user = payload;
  } catch (error) {
    return reply.status(401).send({
      error: 'AUTH_ERROR',
      message: 'Authentication failed',
      statusCode: 401,
    });
  }
}

export async function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);
      
      if (payload) {
        request.user = payload;
      }
    }
  } catch (error) {
    // Silently ignore auth errors for optional auth
  }
}
