import { Pool } from 'pg';
import { CheckIn, CreateCheckInRequest, CheckInTrend, CheckInStreak } from '@mindpulse/shared-types';
import { submitCheckInJob } from '../queue/jobs';

export class CheckInService {
  constructor(private db: Pool) {}

  async createCheckIn(userId: string, req: CreateCheckInRequest): Promise<CheckIn> {
    const { mood_score, energy_score, stress_score, emotion_tags = [] } = req;

    // Validate scores
    if (mood_score < 1 || mood_score > 10) throw new Error('INVALID_MOOD_SCORE');
    if (energy_score < 1 || energy_score > 10) throw new Error('INVALID_ENERGY_SCORE');
    if (stress_score < 1 || stress_score > 10) throw new Error('INVALID_STRESS_SCORE');

    const result = await this.db.query(
      `INSERT INTO check_ins (user_id, mood_score, energy_score, stress_score, emotion_tags)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, mood_score, energy_score, stress_score, emotion_tags, duration_ms, checked_at, created_at`,
      [userId, mood_score, energy_score, stress_score, emotion_tags]
    );

    const checkIn = result.rows[0] as CheckIn;

    // Submit queue job for processing
    await submitCheckInJob(userId, checkIn.id);

    return checkIn;
  }

  async getCheckIns(
    userId: string,
    filters?: { from?: string; to?: string; limit?: number; offset?: number }
  ): Promise<{ checkins: CheckIn[]; total: number }> {
    let query = 'SELECT * FROM check_ins WHERE user_id = $1';
    let countQuery = 'SELECT COUNT(*) as total FROM check_ins WHERE user_id = $1';
    const params: any[] = [userId];
    let paramCount = 2;

    if (filters?.from) {
      query += ` AND checked_at >= $${paramCount}`;
      countQuery += ` AND checked_at >= $${paramCount}`;
      params.push(filters.from);
      paramCount++;
    }

    if (filters?.to) {
      query += ` AND checked_at <= $${paramCount}`;
      countQuery += ` AND checked_at <= $${paramCount}`;
      params.push(filters.to);
      paramCount++;
    }

    query += ' ORDER BY checked_at DESC';

    if (filters?.limit) {
      query += ` LIMIT ${filters.limit}`;
    }
    if (filters?.offset) {
      query += ` OFFSET ${filters.offset}`;
    }

    const [checkinsResult, countResult] = await Promise.all([
      this.db.query(query, params),
      this.db.query(countQuery, params.slice(0, paramCount - 1)),
    ]);

    return {
      checkins: checkinsResult.rows as CheckIn[],
      total: parseInt(countResult.rows[0].total, 10),
    };
  }

  async getStreak(userId: string): Promise<CheckInStreak> {
    // Get current streak (consecutive days)
    const result = await this.db.query(
      `SELECT 
        (SELECT COUNT(*) FROM check_ins 
         WHERE user_id = $1 
         AND DATE(checked_at) >= CURRENT_DATE - INTERVAL '1 day'
         ORDER BY DATE(checked_at) DESC) as current_streak,
        (
          WITH RECURSIVE date_series AS (
            SELECT MAX(DATE(checked_at)) as check_date FROM check_ins WHERE user_id = $1
            UNION ALL
            SELECT check_date - INTERVAL '1 day' FROM date_series 
            WHERE check_date > CURRENT_DATE - INTERVAL '365 days'
          )
          SELECT COUNT(*) FROM (
            SELECT DISTINCT DATE(checked_at) FROM check_ins WHERE user_id = $1
          ) sq
        ) as longest_streak`,
      [userId]
    );

    return {
      current_streak: parseInt(result.rows[0].current_streak, 10),
      longest_streak: parseInt(result.rows[0].longest_streak, 10),
    };
  }

  async getTrends(userId: string, period: '7d' | '30d' | '90d'): Promise<CheckInTrend> {
    const days = parseInt(period);
    const result = await this.db.query(
      `SELECT 
        AVG(mood_score) as avg_mood,
        AVG(energy_score) as avg_energy,
        AVG(stress_score) as avg_stress
       FROM check_ins 
       WHERE user_id = $1 
       AND checked_at >= NOW() - INTERVAL '${days} days'`,
      [userId]
    );

    const row = result.rows[0];
    const avgMood = parseFloat(row.avg_mood) || 0;
    const avgEnergy = parseFloat(row.avg_energy) || 0;
    const avgStress = parseFloat(row.avg_stress) || 0;

    // Calculate trend (simplified: higher is better for mood/energy, lower is better for stress)
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';

    // Compare first half vs second half of the period
    const halfDays = days / 2;
    const trendResult = await this.db.query(
      `SELECT 
        AVG(CASE WHEN checked_at >= NOW() - INTERVAL '${days} days' 
                  AND checked_at < NOW() - INTERVAL '${halfDays} days' 
                  THEN mood_score ELSE NULL END) as early_avg,
        AVG(CASE WHEN checked_at >= NOW() - INTERVAL '${halfDays} days' 
                  THEN mood_score ELSE NULL END) as recent_avg
       FROM check_ins 
       WHERE user_id = $1`,
      [userId]
    );

    const trendRow = trendResult.rows[0];
    if (trendRow.early_avg && trendRow.recent_avg) {
      if (trendRow.recent_avg > trendRow.early_avg + 0.5) {
        trendDirection = 'up';
      } else if (trendRow.recent_avg < trendRow.early_avg - 0.5) {
        trendDirection = 'down';
      }
    }

    return {
      period,
      avg_mood_score: avgMood,
      avg_energy_score: avgEnergy,
      avg_stress_score: avgStress,
      trend_direction: trendDirection,
    };
  }
}
