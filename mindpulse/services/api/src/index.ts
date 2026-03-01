import 'dotenv/config';
import { createApp, startServer } from './fastify';
import { initializePostgres, initializeMongoDB, initializeRedis, closeAllConnections } from './db/connection';
import { authRoutes } from './routes/auth';
import { checkInRoutes } from './routes/checkins';
import { aiRoutes } from './routes/ai';
import { journalRoutes } from './routes/journals';
import { integrationsAndTeamsRoutes } from './routes/integrationsAndTeams';
import { userRoutes } from './routes/user';

async function main(): Promise<void> {
  try {
    // Initialize databases
    console.log('Initializing databases...');
    await initializePostgres();
    await initializeMongoDB();
    await initializeRedis();

    // Create Fastify app
    console.log('Creating Fastify app...');
    const app = createApp();

    // Register routes
    console.log('Registering routes...');
    const resolvedApp = await app;
    await authRoutes(resolvedApp);
    await checkInRoutes(resolvedApp);
    await aiRoutes(resolvedApp);
    await journalRoutes(resolvedApp);
    await integrationsAndTeamsRoutes(resolvedApp);
    await userRoutes(resolvedApp);

    // Start server
    console.log('Starting server...');
    await startServer(resolvedApp);

    // Graceful shutdown
    const signals = ['SIGTERM', 'SIGINT'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\nReceived ${signal}, shutting down gracefully...`);
        try {
          await resolvedApp.close();
          await closeAllConnections();
          console.log('✓ Successfully shut down');
          process.exit(0);
        } catch (err) {
          console.error('Error during shutdown:', err);
          process.exit(1);
        }
      });
    });
  } catch (error) {
    console.error('Fatal error:', error);
    await closeAllConnections();
    process.exit(1);
  }
}

main();
