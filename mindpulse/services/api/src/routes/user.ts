import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPostgresPool } from '../db/connection';
import { UserService } from '../services/UserService';
import { authenticateToken } from '../middleware/auth';
import { submitUserDeletionJob } from '../queue/jobs';

export async function userRoutes(app: FastifyInstance): Promise<void> {
  const db = getPostgresPool();
  const userService = new UserService(db);

  // Get user profile
  app.get(
    '/api/v1/user/me',
    { onRequest: [authenticateToken] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({
            error: 'UNAUTHORIZED',
            message: 'User not authenticated',
            statusCode: 401,
          });
        }

        const user = await userService.getUserById(request.user.sub);
        return reply.send(user);
      } catch (error: any) {
        if (error.message === 'USER_NOT_FOUND') {
          return reply.status(404).send({
            error: 'NOT_FOUND',
            message: 'User not found',
            statusCode: 404,
          });
        }

        console.error('Get user error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to fetch user',
          statusCode: 500,
        });
      }
    }
  );

  // Update user profile
  app.put(
    '/api/v1/user/me',
    { onRequest: [authenticateToken] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({
            error: 'UNAUTHORIZED',
            message: 'User not authenticated',
            statusCode: 401,
          });
        }

        const { timezone, checkin_time } = request.body as { timezone?: string; checkin_time?: string };

        const updates: any = {};
        if (timezone) updates.timezone = timezone;
        if (checkin_time) updates.checkin_time = checkin_time;

        if (Object.keys(updates).length === 0) {
          return reply.status(400).send({
            error: 'VALIDATION_ERROR',
            message: 'No valid fields to update',
            statusCode: 400,
          });
        }

        const user = await userService.updateUser(request.user.sub, updates);
        return reply.send(user);
      } catch (error: any) {
        console.error('Update user error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to update user',
          statusCode: 500,
        });
      }
    }
  );

  // Delete user account
  app.delete(
    '/api/v1/user/me',
    { onRequest: [authenticateToken] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({
            error: 'UNAUTHORIZED',
            message: 'User not authenticated',
            statusCode: 401,
          });
        }

        // Submit async deletion job
        await submitUserDeletionJob(request.user.sub);

        return reply.send({
          success: true,
          message: 'User deletion initiated. This may take a few minutes to complete.',
        });
      } catch (error: any) {
        console.error('Delete user error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to delete user',
          statusCode: 500,
        });
      }
    }
  );

  // Export user data
  app.get(
    '/api/v1/user/export',
    { onRequest: [authenticateToken] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({
            error: 'UNAUTHORIZED',
            message: 'User not authenticated',
            statusCode: 401,
          });
        }

        // TODO: Implement data export functionality
        // This would:
        // 1. Gather all user data from PostgreSQL and MongoDB
        // 2. Create a JSON export
        // 3. Upload to S3
        // 4. Send email with download link

        return reply.status(501).send({
          error: 'NOT_IMPLEMENTED',
          message: 'Data export functionality coming soon',
          statusCode: 501,
        });
      } catch (error: any) {
        console.error('Export user data error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to export user data',
          statusCode: 500,
        });
      }
    }
  );
}
