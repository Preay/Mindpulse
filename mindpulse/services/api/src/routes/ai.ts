import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPostgresPool } from '../db/connection';
import { AIService } from '../services/AIService';
import { authenticateToken } from '../middleware/auth';

export async function aiRoutes(app: FastifyInstance): Promise<void> {
  const db = getPostgresPool();
  const aiService = new AIService(db);

  // Get burnout score
  app.get(
    '/api/v1/ai/burnout-score',
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

        const result = await db.query(
          `SELECT * FROM burnout_scores 
           WHERE user_id = $1 
           ORDER BY computed_at DESC 
           LIMIT 1`,
          [request.user.sub]
        );

        if (result.rows.length === 0) {
          // Calculate fresh burnout score
          const burnoutScore = await aiService.calculateBurnoutScore(request.user.sub);
          if (!burnoutScore) {
            return reply.status(400).send({
              error: 'INSUFFICIENT_DATA',
              message: 'Not enough check-ins to calculate burnout score. Please complete at least 7 check-ins.',
              statusCode: 400,
            });
          }
          return reply.send(burnoutScore);
        }

        return reply.send(result.rows[0]);
      } catch (error: any) {
        console.error('Get burnout score error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to get burnout score',
          statusCode: 500,
        });
      }
    }
  );

  // Get intervention recommendations
  app.get(
    '/api/v1/ai/interventions',
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

        // Get latest stress score from most recent check-in
        const checkInResult = await db.query(
          `SELECT stress_score FROM check_ins 
           WHERE user_id = $1 
           ORDER BY checked_at DESC 
           LIMIT 1`,
          [request.user.sub]
        );

        const currentStress = checkInResult.rows[0]?.stress_score || 5;

        const recommendations = await aiService.getInterventionRecommendations(
          request.user.sub,
          currentStress
        );

        return reply.send({ interventions: recommendations });
      } catch (error: any) {
        console.error('Get interventions error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to get intervention recommendations',
          statusCode: 500,
        });
      }
    }
  );

  // Log intervention feedback
  app.post<{ Params: { id: string }; Body: { completed: boolean; post_mood_score?: number } }>(
    '/api/v1/ai/interventions/:id/feedback',
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

        const { id } = request.params as { id: string };
        const { completed, post_mood_score } = request.body;

        // Get current mood if not provided
        let postMoodDelta = null;
        if (post_mood_score) {
          const checkInResult = await db.query(
            `SELECT stress_score FROM check_ins 
             WHERE user_id = $1 
             ORDER BY checked_at DESC 
             LIMIT 1`,
            [request.user.sub]
          );

          if (checkInResult.rows[0]) {
            postMoodDelta = post_mood_score - checkInResult.rows[0].stress_score;
          }
        }

        // Get the intervention to log it
        const interventionResult = await db.query('SELECT id FROM interventions WHERE id = $1', [id]);

        if (interventionResult.rows.length === 0) {
          return reply.status(404).send({
            error: 'NOT_FOUND',
            message: 'Intervention not found',
            statusCode: 404,
          });
        }

        const logResult = await db.query(
          `INSERT INTO intervention_logs (user_id, intervention_id, completed, post_mood_delta, triggered_stress_score)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [request.user.sub, id, completed, postMoodDelta, null]
        );

        return reply.status(201).send(logResult.rows[0]);
      } catch (error: any) {
        console.error('Log intervention feedback error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to log intervention feedback',
          statusCode: 500,
        });
      }
    }
  );

  // Get weekly insights
  app.get(
    '/api/v1/ai/insights',
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

        const insight = await aiService.generateWeeklyInsight(request.user.sub);
        return reply.send({ insight });
      } catch (error: any) {
        console.error('Get insights error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to generate insights',
          statusCode: 500,
        });
      }
    }
  );
}
