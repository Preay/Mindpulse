import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import multipart from '@fastify/multipart';
import { getMongoDb, getPostgresPool } from '../db/connection';
import { JournalService } from '../services/JournalService';
import { authenticateToken } from '../middleware/auth';

export async function journalRoutes(app: FastifyInstance): Promise<void> {
  const mongoDb = getMongoDb();
  const postgresDb = getPostgresPool();
  const journalService = new JournalService(mongoDb, postgresDb);

  // Register multipart plugin for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: 60 * 1024 * 1024, // 60MB
    },
  });

  // Upload voice journal
  app.post(
    '/api/v1/journals/voice',
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

        const data = await request.file();

        if (!data) {
          return reply.status(400).send({
            error: 'VALIDATION_ERROR',
            message: 'No audio file provided',
            statusCode: 400,
          });
        }

        const buffer = await data.toBuffer();

        // Get mood score from form data if provided
        const moodScore = parseInt(data.fields.mood_score?.value as any) || undefined;

        const entry = await journalService.createVoiceJournal(request.user.sub, buffer, moodScore);
        return reply.status(201).send(entry);
      } catch (error: any) {
        console.error('Upload voice journal error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to upload voice journal',
          statusCode: 500,
        });
      }
    }
  );

  // Create text journal
  app.post<{ Body: { text: string; mood_score?: number } }>(
    '/api/v1/journals/text',
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

        const { text, mood_score } = request.body;

        if (!text || text.trim().length === 0) {
          return reply.status(400).send({
            error: 'VALIDATION_ERROR',
            message: 'Journal text cannot be empty',
            statusCode: 400,
          });
        }

        const entry = await journalService.createTextJournal(request.user.sub, text, mood_score);
        return reply.status(201).send(entry);
      } catch (error: any) {
        console.error('Create text journal error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to create text journal',
          statusCode: 500,
        });
      }
    }
  );

  // Get journals
  app.get(
    '/api/v1/journals',
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

        const query = request.query as { limit?: string; offset?: string };
        const limit = query.limit ? parseInt(query.limit) : 10;
        const offset = query.offset ? parseInt(query.offset) : 0;

        const { entries, total } = await journalService.getJournalEntries(request.user.sub, limit, offset);

        return reply.send({
          data: entries,
          total,
          limit,
          offset,
        });
      } catch (error: any) {
        console.error('Get journals error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to fetch journals',
          statusCode: 500,
        });
      }
    }
  );

  // Get single journal
  app.get(
    '/api/v1/journals/:id',
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
        const entry = await journalService.getJournalEntry(request.user.sub, id);

        if (!entry) {
          return reply.status(404).send({
            error: 'NOT_FOUND',
            message: 'Journal entry not found',
            statusCode: 404,
          });
        }

        return reply.send(entry);
      } catch (error: any) {
        console.error('Get journal error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to fetch journal',
          statusCode: 500,
        });
      }
    }
  );

  // Delete journal
  app.delete(
    '/api/v1/journals/:id',
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
        await journalService.deleteJournalEntry(request.user.sub, id);

        return reply.send({ success: true, message: 'Journal deleted successfully' });
      } catch (error: any) {
        if (error.message === 'JOURNAL_NOT_FOUND') {
          return reply.status(404).send({
            error: 'NOT_FOUND',
            message: 'Journal entry not found',
            statusCode: 404,
          });
        }

        console.error('Delete journal error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to delete journal',
          statusCode: 500,
        });
      }
    }
  );
}
