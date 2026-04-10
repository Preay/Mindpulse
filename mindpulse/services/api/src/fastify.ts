import Fastify, { FastifyInstance } from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // Security middleware
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: true,
  });

  // CORS
  await app.register(fastifyCors, {
    origin: true, // Allow all origins in development; restrict in production
    credentials: true,
  });

  // Rate limiting
  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '15 minutes',
  });

  // Health check endpoint
  app.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return app;
}

export async function startServer(app: FastifyInstance): Promise<void> {
  const PORT = parseInt(process.env.PORT || '3001', 10);
  const HOST = process.env.HOST || '0.0.0.0';

  await app.listen({ port: PORT, host: HOST });
  console.log(`✓ Server running on http://${HOST}:${PORT}`);
}
