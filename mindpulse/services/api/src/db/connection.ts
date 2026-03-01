import { Pool } from 'pg';
import { MongoClient, Db } from 'mongodb';
import { createClient, RedisClientType } from 'redis';

let postgresPool: Pool;
let mongoClient: MongoClient;
let mongoDb: Db;
let redisClient: RedisClientType;

export async function initializePostgres(): Promise<Pool> {
  if (postgresPool) return postgresPool;

  postgresPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
  });

  postgresPool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

  // Test connection
  const client = await postgresPool.connect();
  await client.query('SELECT NOW()');
  client.release();
  console.log('✓ PostgreSQL connected');

  return postgresPool;
}

export async function initializeMongoDB(): Promise<Db> {
  if (mongoDb) return mongoDb;

  mongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  await mongoClient.connect();
  mongoDb = mongoClient.db('mindpulse');

  // Create indexes
  const journalCollection = mongoDb.collection('journal_entries');
  await journalCollection.createIndex({ user_id: 1 });
  await journalCollection.createIndex({ created_at: -1 });
  await journalCollection.createIndex({ audio_purge_at: 1 }, { expireAfterSeconds: 0 });

  console.log('✓ MongoDB connected');
  return mongoDb;
}

export async function initializeRedis(): Promise<RedisClientType> {
  if (redisClient) return redisClient;

  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  redisClient.on('error', (err) => console.log('Redis Client Error', err));
  await redisClient.connect();
  console.log('✓ Redis connected');

  return redisClient;
}

export function getPostgresPool(): Pool {
  if (!postgresPool) {
    throw new Error('PostgreSQL pool not initialized');
  }
  return postgresPool;
}

export function getMongoDb(): Db {
  if (!mongoDb) {
    throw new Error('MongoDB not initialized');
  }
  return mongoDb;
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
}

export async function closeAllConnections(): Promise<void> {
  if (postgresPool) {
    await postgresPool.end();
  }
  if (mongoClient) {
    await mongoClient.close();
  }
  if (redisClient) {
    await redisClient.quit();
  }
}
