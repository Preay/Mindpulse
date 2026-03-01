import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPostgresPool } from '../db/connection';
import { CheckInService } from '../services/CheckInService';
import { authenticateToken } from '../middleware/auth';
import { CreateCheckInRequest } from '@mindpulse/shared-types';

export async function checkInRoutes(app: FastifyInstance): Promise<void> {
  const db = getPostgresPool();
  const checkInService = new CheckInService(db);

  // Create check-in
  app.post<{ Body: CreateCheckInRequest }>(
    '/api/v1/checkins',
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

        const checkIn = await checkInService.createCheckIn(request.user.sub, request.body);
        return reply.status(201).send(checkIn);
      } catch (error: any) {
        console.error('Create check-in error:', error);
        
        if (error.message.includes('INVALID_')) {
          return reply.status(400).send({
            error: 'VALIDATION_ERROR',
            message: error.message,
            statusCode: 400,
          });
        }

        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to create check-in',
          statusCode: 500,
        });
      }
    }
  );

  // Get check-ins
  app.get(
    '/api/v1/checkins',
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

        const query = request.query as {
          from?: string;
          to?: string;
          limit?: string;
          offset?: string;
        };

        const { checkins, total } = await checkInService.getCheckIns(request.user.sub, {
          from: query.from,
          to: query.to,
          limit: query.limit ? parseInt(query.limit) : 20,
          offset: query.offset ? parseInt(query.offset) : 0,
        });

        return reply.send({
          data: checkins,
          total,
          limit: query.limit ? parseInt(query.limit) : 20,
          offset: query.offset ? parseInt(query.offset) : 0,
        });
      } catch (error: any) {
        console.error('Get check-ins error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to fetch check-ins',
          statusCode: 500,
        });
      }
    }
  );

  // Get streak
  app.get(
    '/api/v1/checkins/streak',
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

        const streak = await checkInService.getStreak(request.user.sub);
        return reply.send(streak);
      } catch (error: any) {
        console.error('Get streak error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to fetch streak',
          statusCode: 500,
        });
      }
    }
  );

  // Get trends
  app.get(
    '/api/v1/checkins/trends',
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

        const query = request.query as { period?: string };
        const period = (query.period || '7d') as '7d' | '30d' | '90d';

        if (!['7d', '30d', '90d'].includes(period)) {
          return reply.status(400).send({
            error: 'VALIDATION_ERROR',
            message: "Period must be '7d', '30d', or '90d'",
            statusCode: 400,
          });
        }

        const trends = await checkInService.getTrends(request.user.sub, period);
        return reply.send(trends);
      } catch (error: any) {
        console.error('Get trends error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to fetch trends',
          statusCode: 500,
        });
      }
    }
  );
}
