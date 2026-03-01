import axios from 'axios';
import { 
  BurnoutScore, 
  BurnoutScoreRequest,
  InterventionRecommendation,
  InterventionRecommendationRequest,
  JournalProcessResponse,
  JournalProcessRequest
} from '@mindpulse/shared-types';
import { Pool } from 'pg';

export class AIService {
  private baseURL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

  constructor(private db?: Pool) {}

  async calculateBurnoutScore(userId: string): Promise<BurnoutScore | null> {
    try {
      // Get last 14 check-ins
      if (!this.db) throw new Error('Database not initialized');

      const checkinsResult = await this.db.query(
        `SELECT mood_score, energy_score, stress_score, checked_at FROM check_ins 
         WHERE user_id = $1 
         ORDER BY checked_at DESC 
         LIMIT 14`,
        [userId]
      );

      if (checkinsResult.rows.length < 7) {
        // Not enough data
        return null;
      }

      // Get calendar density if connected
      let calendarDensity = 0; // TODO: Implement calendar API integration

      // Get check-in rate
      const rateResult = await this.db.query(
        `SELECT COUNT(*) as count FROM check_ins 
         WHERE user_id = $1 
         AND checked_at >= NOW() - INTERVAL '14 days'`,
        [userId]
      );

      const checkinRate = parseInt(rateResult.rows[0].count) / 14;

      const request: BurnoutScoreRequest = {
        user_id: userId,
        checkins_14d: checkinsResult.rows,
        calendar_density: calendarDensity,
        checkin_rate: checkinRate,
      };

      const response = await axios.post(`${this.baseURL}/score/burnout`, request);
      const result = response.data;

      // Store in database
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      await this.db.query(
        `INSERT INTO burnout_scores (user_id, score, risk_level, factors, week_start)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, week_start) DO UPDATE SET score = $2, risk_level = $3, factors = $4`,
        [
          userId,
          result.score,
          result.risk_level,
          JSON.stringify(result.factors),
          weekStart.toISOString().split('T')[0],
        ]
      );

      return {
        id: '', // Placeholder
        user_id: userId,
        score: result.score,
        risk_level: result.risk_level,
        factors: result.factors,
        week_start: weekStart.toISOString().split('T')[0],
        computed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error calculating burnout score:', error);
      return null;
    }
  }

  async getInterventionRecommendations(
    userId: string,
    currentStress: number
  ): Promise<InterventionRecommendation[]> {
    try {
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

      // Get past intervention ratings
      const ratingsResult = await this.db?.query(
        `SELECT intervention_id, AVG(CASE WHEN post_mood_delta > 0 THEN 5 ELSE 1 END) as rating
         FROM intervention_logs 
         WHERE user_id = $1 AND completed = TRUE
         GROUP BY intervention_id
         ORDER BY rating DESC
         LIMIT 3`,
        [userId]
      );

      const pastRatings = ratingsResult?.rows || [];

      const request: InterventionRecommendationRequest = {
        user_id: userId,
        current_stress: currentStress,
        time_of_day: timeOfDay,
        calendar_gap_minutes: 30, // TODO: Integrate with calendar
        past_ratings: pastRatings,
      };

      const response = await axios.post(`${this.baseURL}/recommend/interventions`, request);
      return response.data.interventions;
    } catch (error) {
      console.error('Error getting intervention recommendations:', error);
      return [];
    }
  }

  async processJournal(
    userId: string,
    audioBase64?: string,
    text?: string
  ): Promise<JournalProcessResponse> {
    try {
      const request: JournalProcessRequest = {
        user_id: userId,
        audio_base64: audioBase64,
        text,
      };

      const response = await axios.post(`${this.baseURL}/process/journal`, request);
      return response.data;
    } catch (error) {
      console.error('Error processing journal:', error);
      throw error;
    }
  }

  async generateWeeklyInsight(userId: string): Promise<string> {
    try {
      if (!this.db) throw new Error('Database not initialized');

      // Get week summary
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      const summaryResult = await this.db.query(
        `SELECT 
          AVG(mood_score) as mood_avg,
          AVG(stress_score) as stress_avg,
          COUNT(*) as checkin_count
         FROM check_ins 
         WHERE user_id = $1 AND checked_at >= $2`,
        [userId, weekStart.toISOString()]
      );

      const summary = summaryResult.rows[0];

      // Get burnout score change
      const burnoutResult = await this.db.query(
        `SELECT score FROM burnout_scores 
         WHERE user_id = $1 
         ORDER BY week_start DESC 
         LIMIT 2`,
        [userId]
      );

      const burnoutDelta =
        burnoutResult.rows.length === 2
          ? burnoutResult.rows[0].score - burnoutResult.rows[1].score
          : 0;

      const response = await axios.post(`${this.baseURL}/generate/insight`, {
        user_id: userId,
        week_summary: {
          mood_avg: parseFloat(summary.mood_avg) || 0,
          burnout_delta: burnoutDelta,
          top_stressors: [], // TODO: Extract from journals
          checkin_rate: summary.checkin_count / 7,
        },
      });

      return response.data.insight;
    } catch (error) {
      console.error('Error generating insight:', error);
      throw error;
    }
  }
}
