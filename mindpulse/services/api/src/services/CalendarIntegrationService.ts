import { Pool } from 'pg';
import axios from 'axios';
import { CalendarIntegration, CalendarConnectRequest, CalendarCorrelation } from '@mindpulse/shared-types';
import { encryptData, decryptData } from '../utils/auth';

export class CalendarIntegrationService {
  constructor(private db: Pool) {}

  async connectCalendar(userId: string, req: CalendarConnectRequest): Promise<CalendarIntegration> {
    const { provider, code } = req;

    // TODO: Exchange OAuth code for tokens (implement for Google/Outlook)
    // This is a placeholder - actual implementation would fetch tokens from OAuth provider

    const accessToken = 'placeholder_access_token';
    const refreshToken = 'placeholder_refresh_token';

    // Encrypt tokens
    const encryptedAccessToken = encryptData(accessToken);
    const encryptedRefreshToken = encryptData(refreshToken);

    const result = await this.db.query(
      `INSERT INTO calendar_integrations (user_id, provider, access_token, refresh_token)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, provider) DO UPDATE SET access_token = $3, refresh_token = $4, connected_at = NOW()
       RETURNING *`,
      [userId, provider, encryptedAccessToken, encryptedRefreshToken]
    );

    return this.formatCalendarIntegration(result.rows[0]);
  }

  async disconnectCalendar(userId: string, provider: string): Promise<void> {
    await this.db.query(
      'DELETE FROM calendar_integrations WHERE user_id = $1 AND provider = $2',
      [userId, provider]
    );
  }

  async getIntegration(userId: string, provider: string): Promise<CalendarIntegration | null> {
    const result = await this.db.query(
      'SELECT * FROM calendar_integrations WHERE user_id = $1 AND provider = $2',
      [userId, provider]
    );

    if (result.rows.length === 0) return null;
    return this.formatCalendarIntegration(result.rows[0]);
  }

  async getCalendarCorrelation(userId: string): Promise<CalendarCorrelation | null> {
    try {
      // Get check-ins grouped by busy/free days
      const result = await this.db.query(
        `SELECT 
          COUNT(*) as check_ins,
          AVG(mood_score) as avg_mood,
          AVG(stress_score) as avg_stress
         FROM check_ins
         WHERE user_id = $1
         GROUP BY DATE(checked_at)`,
        [userId]
      );

      // Placeholder correlation data
      return {
        mood_vs_busy_days: {
          busy_day_avg_mood: 6.5,
          free_day_avg_mood: 7.5,
          correlation: -0.23, // Negative correlation: busier days = lower mood
        },
        stress_patterns: [
          { day_of_week: 'Monday', avg_stress: 7.2, meeting_count: 5 },
          { day_of_week: 'Tuesday', avg_stress: 6.8, meeting_count: 4 },
          { day_of_week: 'Wednesday', avg_stress: 6.5, meeting_count: 3 },
          { day_of_week: 'Thursday', avg_stress: 6.9, meeting_count: 4 },
          { day_of_week: 'Friday', avg_stress: 5.8, meeting_count: 2 },
        ],
      };
    } catch (error) {
      console.error('Error getting calendar correlation:', error);
      return null;
    }
  }

  private formatCalendarIntegration(row: any): CalendarIntegration {
    return {
      id: row.id,
      user_id: row.user_id,
      provider: row.provider,
      connected_at: row.connected_at?.toISOString() || new Date().toISOString(),
      last_synced_at: row.last_synced_at?.toISOString(),
      created_at: row.created_at?.toISOString() || new Date().toISOString(),
      updated_at: row.updated_at?.toISOString() || new Date().toISOString(),
    };
  }
}
