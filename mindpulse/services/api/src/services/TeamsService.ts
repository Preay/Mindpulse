import { Pool } from 'pg';
import { TeamDashboard, TeamMember } from '@mindpulse/shared-types';

export class TeamsService {
  constructor(private db: Pool) {}

  async getTeamDashboard(orgId: string): Promise<TeamDashboard | null> {
    try {
      // Check if org has at least 10 active users
      const usersResult = await this.db.query(
        'SELECT COUNT(*) as count FROM users WHERE org_id = $1 AND created_at > NOW() - INTERVAL \'30 days\'',
        [orgId]
      );

      const activeUsers = parseInt(usersResult.rows[0].count);

      if (activeUsers < 10) {
        return null; // Not enough users to display dashboard
      }

      // Get aggregate metrics for the week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      const metricsResult = await this.db.query(
        `SELECT 
          COUNT(DISTINCT ci.user_id) as active_users,
          AVG(ci.mood_score) as avg_mood,
          AVG(ci.stress_score) as avg_stress,
          AVG(bs.score) as avg_burnout,
          COUNT(DISTINCT CASE WHEN ci.checked_at >= CURRENT_DATE THEN ci.user_id END)::float / 
          COUNT(DISTINCT ci.user_id) as checkin_rate
         FROM check_ins ci
         LEFT JOIN burnout_scores bs ON ci.user_id = bs.user_id AND bs.week_start = $2
         WHERE ci.user_id IN (SELECT id FROM users WHERE org_id = $1)
         AND ci.checked_at >= $2`,
        [orgId, weekStart.toISOString().split('T')[0]]
      );

      const metrics = metricsResult.rows[0];

      // Get weekly breakdown
      const weeklyResult = await this.db.query(
        `SELECT 
          DATE_TRUNC('week', ci.checked_at)::date as week_start,
          AVG(ci.mood_score) as avg_mood,
          AVG(ci.stress_score) as avg_stress,
          COUNT(*) as checkin_count
         FROM check_ins ci
         WHERE ci.user_id IN (SELECT id FROM users WHERE org_id = $1)
         AND ci.checked_at >= CURRENT_DATE - INTERVAL '8 weeks'
         GROUP BY DATE_TRUNC('week', ci.checked_at)
         ORDER BY week_start DESC`,
        [orgId]
      );

      return {
        total_active_users: activeUsers,
        avg_mood: parseFloat(metrics.avg_mood) || 0,
        avg_stress: parseFloat(metrics.avg_stress) || 0,
        avg_burnout_score: parseFloat(metrics.avg_burnout) || 0,
        checkin_rate: parseFloat(metrics.checkin_rate) || 0,
        week_data: weeklyResult.rows.map((row: any) => ({
          week_start: row.week_start,
          avg_mood: parseFloat(row.avg_mood) || 0,
          avg_stress: parseFloat(row.avg_stress) || 0,
          checkin_count: row.checkin_count,
        })),
      };
    } catch (error) {
      console.error('Error getting team dashboard:', error);
      return null;
    }
  }

  async getTeamMembers(orgId: string, limit: number = 50, offset: number = 0): Promise<{ members: TeamMember[]; total: number }> {
    try {
      const result = await this.db.query(
        'SELECT id, email, created_at FROM users WHERE org_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [orgId, limit, offset]
      );

      const totalResult = await this.db.query('SELECT COUNT(*) as count FROM users WHERE org_id = $1', [orgId]);

      return {
        members: result.rows.map((row: any) => ({
          id: row.id,
          email: row.email,
          joined_at: row.created_at?.toISOString() || new Date().toISOString(),
        })),
        total: parseInt(totalResult.rows[0].count),
      };
    } catch (error) {
      console.error('Error getting team members:', error);
      return { members: [], total: 0 };
    }
  }

  async inviteTeamMember(orgId: string, email: string): Promise<void> {
    try {
      // Check if user already exists
      const existingUser = await this.db.query(
        'SELECT id FROM users WHERE email = $1 AND org_id = $2',
        [email.toLowerCase(), orgId]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('USER_ALREADY_IN_ORG');
      }

      // TODO: Send invite email or create invite token
      // For now, this is a placeholder that would trigger email sending

      console.log(`Invite sent to ${email} for organization ${orgId}`);
    } catch (error: any) {
      if (error.message === 'USER_ALREADY_IN_ORG') {
        throw error;
      }
      console.error('Error inviting team member:', error);
      throw error;
    }
  }
}
