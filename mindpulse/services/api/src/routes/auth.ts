import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { getPostgresPool } from '../db/connection';
import { UserService } from '../services/UserService';
import { generateAccessToken, hashRefreshToken } from '../utils/auth';
import { TokenResponse, UserRegistrationRequest } from '@mindpulse/shared-types';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const db = getPostgresPool();
  const userService = new UserService(db);

  // Register
  app.post<{ Body: UserRegistrationRequest }>(
    '/api/v1/auth/register',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { email, password } = request.body;

        if (!email || !password) {
          return reply.status(400).send({
            error: 'VALIDATION_ERROR',
            message: 'Email and password are required',
            statusCode: 400,
          });
        }

        if (password.length < 8) {
          return reply.status(400).send({
            error: 'VALIDATION_ERROR',
            message: 'Password must be at least 8 characters',
            statusCode: 400,
          });
        }

        const { user, accessToken, refreshToken } = await userService.register({
          email,
          password,
        });

        const response: TokenResponse & { user: any } = {
          user: {
            id: user.id,
            email: user.email,
            plan_tier: user.plan_tier,
          },
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 900, // 15 minutes
          token_type: 'Bearer',
        };

        return reply.status(201).send(response);
      } catch (error: any) {
        if (error.message === 'USER_ALREADY_EXISTS') {
          return reply.status(409).send({
            error: 'USER_EXISTS',
            message: 'User with this email already exists',
            statusCode: 409,
          });
        }

        console.error('Register error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to register user',
          statusCode: 500,
        });
      }
    }
  );

  // Login
  app.post<{ Body: { email: string; password: string } }>(
    '/api/v1/auth/login',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { email, password } = request.body;

        if (!email || !password) {
          return reply.status(400).send({
            error: 'VALIDATION_ERROR',
            message: 'Email and password are required',
            statusCode: 400,
          });
        }

        const { user, accessToken, refreshToken } = await userService.login(email, password);

        const response: TokenResponse & { user: any } = {
          user: {
            id: user.id,
            email: user.email,
            plan_tier: user.plan_tier,
          },
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 900,
          token_type: 'Bearer',
        };

        return reply.send(response);
      } catch (error: any) {
        if (error.message === 'INVALID_CREDENTIALS') {
          return reply.status(401).send({
            error: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
            statusCode: 401,
          });
        }

        console.error('Login error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to login',
          statusCode: 500,
        });
      }
    }
  );

  // Refresh token
  app.post<{ Body: { refreshToken: string } }>(
    '/api/v1/auth/refresh',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { refreshToken } = request.body;

        if (!refreshToken) {
          return reply.status(400).send({
            error: 'VALIDATION_ERROR',
            message: 'Refresh token is required',
            statusCode: 400,
          });
        }

        // Verify refresh token in database
        const refreshTokenHash = hashRefreshToken(refreshToken);
        const result = await db.query(
          `SELECT user_id, expires_at, revoked FROM refresh_tokens 
           WHERE token_hash = $1 AND revoked = FALSE AND expires_at > NOW()`,
          [refreshTokenHash]
        );

        if (result.rows.length === 0) {
          return reply.status(401).send({
            error: 'INVALID_REFRESH_TOKEN',
            message: 'Invalid or expired refresh token',
            statusCode: 401,
          });
        }

        const { user_id } = result.rows[0];
        const user = await userService.getUserById(user_id);
        const newAccessToken = generateAccessToken(user.id, user.plan_tier, user.org_id);

        const response: TokenResponse = {
          access_token: newAccessToken,
          refresh_token: refreshToken, // Return the same refresh token
          expires_in: 900,
          token_type: 'Bearer',
        };

        return reply.send(response);
      } catch (error: any) {
        console.error('Refresh token error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to refresh token',
          statusCode: 500,
        });
      }
    }
  );

  // Logout
  app.post(
    '/api/v1/auth/logout',
    { onRequest: [require('../middleware/auth').authenticateToken] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({
            error: 'UNAUTHORIZED',
            message: 'User not authenticated',
            statusCode: 401,
          });
        }

        const { refreshToken } = request.body as { refreshToken: string };

        if (refreshToken) {
          await userService.logout(request.user.sub, refreshToken);
        }

        return reply.send({ success: true, message: 'Logged out successfully' });
      } catch (error: any) {
        console.error('Logout error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to logout',
          statusCode: 500,
        });
      }
    }
  );

  // Placeholder OAuth endpoints
  app.post('/api/v1/auth/oauth/google', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(501).send({
      error: 'NOT_IMPLEMENTED',
      message: 'OAuth Google login not yet implemented',
      statusCode: 501,
    });
  });

  app.post('/api/v1/auth/oauth/apple', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(501).send({
      error: 'NOT_IMPLEMENTED',
      message: 'OAuth Apple login not yet implemented',
      statusCode: 501,
    });
  });
}
