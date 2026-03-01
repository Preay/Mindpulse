import { Db } from 'mongodb';
import { Pool } from 'pg';
import { JournalEntry } from '@mindpulse/shared-types';
import { encryptData, decryptData } from '../utils/auth';
import { submitJournalProcessJob, submitAudioPurgeJob } from '../queue/jobs';
import { S3Service } from './S3Service';

export class JournalService {
  private s3Service: S3Service;

  constructor(
    private mongoDb: Db,
    private postgresDb: Pool
  ) {
    this.s3Service = new S3Service();
  }

  async createVoiceJournal(userId: string, audioBuffer: Buffer, moodScore?: number): Promise<JournalEntry> {
    // Upload to S3
    const { key, url } = await this.s3Service.uploadAudio(audioBuffer, userId);

    // Create journal entry in MongoDB
    const collection = this.mongoDb.collection('journal_entries');
    const now = new Date();
    const purgeDateDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const result = await collection.insertOne({
      user_id: userId,
      audio_url: url,
      audio_s3_key: key,
      transcript: null,
      ai_summary: '',
      themes: [],
      sentiment_score: 0,
      mood_at_time: moodScore,
      created_at: now,
      audio_purge_at: purgeDateDate,
    });

    // Submit async processing job
    await submitJournalProcessJob(userId, result.insertedId.toString(), key);

    // Schedule audio purge
    await submitAudioPurgeJob(result.insertedId.toString(), key);

    return {
      _id: result.insertedId.toString(),
      user_id: userId,
      audio_url: url,
      themes: [],
      sentiment_score: 0,
      mood_at_time: moodScore,
      created_at: now.toISOString(),
      audio_purge_at: purgeDateDate.toISOString(),
      ai_summary: '',
      transcript: undefined,
    };
  }

  async createTextJournal(userId: string, text: string, moodScore?: number): Promise<JournalEntry> {
    const collection = this.mongoDb.collection('journal_entries');
    const now = new Date();

    // Encrypt the text
    const encryptedText = encryptData(text);

    const result = await collection.insertOne({
      user_id: userId,
      transcript: encryptedText,
      ai_summary: '',
      themes: [],
      sentiment_score: 0,
      mood_at_time: moodScore,
      created_at: now,
    });

    // Submit async processing job
    await submitJournalProcessJob(userId, result.insertedId.toString());

    return {
      _id: result.insertedId.toString(),
      user_id: userId,
      transcript: text, // Return unencrypted for now
      themes: [],
      sentiment_score: 0,
      mood_at_time: moodScore,
      created_at: now.toISOString(),
      ai_summary: '',
    };
  }

  async getJournalEntries(userId: string, limit: number = 10, offset: number = 0): Promise<{
    entries: JournalEntry[];
    total: number;
  }> {
    const collection = this.mongoDb.collection('journal_entries');

    const entries = await collection
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(offset)
      .toArray();

    const total = await collection.countDocuments({ user_id: userId });

    return {
      entries: entries.map((doc: any) => ({
        _id: doc._id?.toString() || '',
        user_id: doc.user_id,
        audio_url: doc.audio_url,
        transcript: doc.transcript ? decryptData(doc.transcript) : undefined,
        ai_summary: doc.ai_summary,
        themes: doc.themes || [],
        sentiment_score: doc.sentiment_score || 0,
        mood_at_time: doc.mood_at_time,
        created_at: doc.created_at?.toISOString(),
        audio_purge_at: doc.audio_purge_at?.toISOString(),
      })),
      total,
    };
  }

  async getJournalEntry(userId: string, entryId: string): Promise<JournalEntry | null> {
    const collection = this.mongoDb.collection('journal_entries');
    const doc = await collection.findOne({
      _id: { $oid: entryId },
      user_id: userId,
    });

    if (!doc) return null;

    return {
      _id: doc._id?.toString() || '',
      user_id: doc.user_id,
      audio_url: doc.audio_url,
      transcript: doc.transcript ? decryptData(doc.transcript) : undefined,
      ai_summary: doc.ai_summary,
      themes: doc.themes || [],
      sentiment_score: doc.sentiment_score || 0,
      mood_at_time: doc.mood_at_time,
      created_at: doc.created_at?.toISOString(),
      audio_purge_at: doc.audio_purge_at?.toISOString(),
    };
  }

  async deleteJournalEntry(userId: string, entryId: string): Promise<void> {
    const collection = this.mongoDb.collection('journal_entries');
    const doc = await collection.findOne({
      _id: { $oid: entryId },
      user_id: userId,
    });

    if (!doc) {
      throw new Error('JOURNAL_NOT_FOUND');
    }

    // Delete audio from S3 if present
    if (doc.audio_s3_key) {
      await this.s3Service.deleteAudio(doc.audio_s3_key);
    }

    // Delete from MongoDB
    await collection.deleteOne({ _id: { $oid: entryId } });
  }

  async updateJournalEntry(
    entryId: string,
    updates: { transcript?: string; ai_summary?: string; themes?: string[]; sentiment_score?: number }
  ): Promise<void> {
    const collection = this.mongoDb.collection('journal_entries');

    const updateObj: any = {};
    if (updates.transcript) updateObj.transcript = encryptData(updates.transcript);
    if (updates.ai_summary) updateObj.ai_summary = updates.ai_summary;
    if (updates.themes) updateObj.themes = updates.themes;
    if (updates.sentiment_score !== undefined) updateObj.sentiment_score = updates.sentiment_score;

    await collection.updateOne({ _id: { $oid: entryId } }, { $set: updateObj });
  }
}
