import Bull from 'bull';
import { getRedisClient } from '../db/connection';
import { CheckInSubmittedJob, JournalProcessJob, UserDeletionJob, AudioPurgeJob } from '@mindpulse/shared-types';

let queues: Map<string, any> = new Map();

export async function getOrCreateQueue(name: string): Promise<any> {
  if (queues.has(name)) {
    return queues.get(name);
  }

  const redis = getRedisClient();
  const queue = new Bull(name, {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
  });

  queues.set(name, queue);

  // Handle errors
  queue.on('error', (error) => {
    console.error(`Queue ${name} error:`, error);
  });

  queue.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err.message);
  });

  return queue;
}

// Specific queue creators
export async function getCheckInQueue(): Promise<Bull.Queue<CheckInSubmittedJob>> {
  return getOrCreateQueue('checkin.submitted');
}

export async function getJournalProcessQueue(): Promise<Bull.Queue<JournalProcessJob>> {
  return getOrCreateQueue('journal.process');
}

export async function getUserDeletionQueue(): Promise<Bull.Queue<UserDeletionJob>> {
  return getOrCreateQueue('user.deletion');
}

export async function getAudioPurgeQueue(): Promise<Bull.Queue<AudioPurgeJob>> {
  return getOrCreateQueue('audio.purge');
}

// Job submission functions
export async function submitCheckInJob(userId: string, checkInId: string): Promise<void> {
  const queue = await getCheckInQueue();
  await queue.add(
    { type: 'checkin.submitted', user_id: userId, check_in_id: checkInId },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
    }
  );
}

export async function submitJournalProcessJob(
  userId: string,
  journalEntryId: string,
  audioPath?: string
): Promise<void> {
  const queue = await getJournalProcessQueue();
  await queue.add(
    {
      type: 'journal.process',
      user_id: userId,
      journal_entry_id: journalEntryId,
      audio_path: audioPath,
    },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
    }
  );
}

export async function submitUserDeletionJob(userId: string): Promise<void> {
  const queue = await getUserDeletionQueue();
  await queue.add(
    { type: 'user.deletion', user_id: userId },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
    }
  );
}

export async function submitAudioPurgeJob(journalEntryId: string, s3Key: string): Promise<void> {
  const queue = await getAudioPurgeQueue();
  await queue.add(
    { type: 'audio.purge', journal_entry_id: journalEntryId, s3_key: s3Key },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      // Schedule this job 30 days in the future
      delay: 30 * 24 * 60 * 60 * 1000,
    }
  );
}

// Clean up function
export async function closeAllQueues(): Promise<void> {
  const promises: Promise<void>[] = [];
  for (const queue of queues.values()) {
    promises.push(queue.close());
  }
  await Promise.all(promises);
  queues.clear();
}
