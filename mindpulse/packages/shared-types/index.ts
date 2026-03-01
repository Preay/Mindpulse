// Plan tiers
export type PlanTier = 'free' | 'pro' | 'teams';

// Risk levels
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

// Intervention types
export type InterventionType = 'breathing' | 'reframe' | 'walk' | 'pause' | 'journal';

// OAuth Providers
export type OAuthProvider = 'google' | 'outlook' | 'apple';

// User-related types
export interface User {
  id: string;
  email: string;
  plan_tier: PlanTier;
  timezone: string;
  checkin_time: string;
  org_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRegistrationRequest {
  email: string;
  password: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
}

export interface JWTPayload {
  sub: string; // user_id
  plan: PlanTier;
  org_id?: string;
  iat: number;
  exp: number;
}

// Check-in types
export interface CheckIn {
  id: string;
  user_id: string;
  mood_score: number; // 1-10
  energy_score: number; // 1-10
  stress_score: number; // 1-10
  emotion_tags: string[];
  duration_ms?: number;
  checked_at: string;
  created_at: string;
}

export interface CreateCheckInRequest {
  mood_score: number;
  energy_score: number;
  stress_score: number;
  emotion_tags?: string[];
}

export interface CheckInTrend {
  period: '7d' | '30d' | '90d';
  avg_mood_score: number;
  avg_energy_score: number;
  avg_stress_score: number;
  trend_direction: 'up' | 'down' | 'stable';
}

export interface CheckInStreak {
  current_streak: number;
  longest_streak: number;
}

// Burnout score types
export interface BurnoutScore {
  id: string;
  user_id: string;
  score: number; // 0-100
  risk_level: RiskLevel;
  factors: Record<string, any>;
  week_start: string;
  computed_at: string;
  created_at: string;
}

// Intervention types
export interface Intervention {
  id: string;
  type: InterventionType;
  title: string;
  description?: string;
  duration_seconds: number;
  content: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface InterventionRecommendation {
  id: string;
  type: InterventionType;
  title: string;
  reason: string;
  duration_seconds: number;
}

export interface InterventionLog {
  id: string;
  user_id: string;
  intervention_id: string;
  triggered_stress_score: number;
  post_mood_delta?: number;
  completed: boolean;
  logged_at: string;
  created_at: string;
}

export interface InterventionFeedbackRequest {
  completed: boolean;
  post_mood_score?: number;
}

// Journal types
export interface JournalEntry {
  _id: string;
  user_id: string;
  audio_url?: string;
  transcript?: string;
  ai_summary: string;
  themes: string[];
  sentiment_score: number; // -1.0 to 1.0
  mood_at_time?: number;
  created_at: string;
  audio_purge_at?: string;
}

export interface CreateJournalEntryRequest {
  audio?: Blob; // for voice journals
  text?: string; // for text journals
}

// Calendar integration types
export interface CalendarIntegration {
  id: string;
  user_id: string;
  provider: OAuthProvider;
  connected_at: string;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarConnectRequest {
  provider: OAuthProvider;
  code: string;
}

export interface CalendarCorrelation {
  mood_vs_busy_days: {
    busy_day_avg_mood: number;
    free_day_avg_mood: number;
    correlation: number;
  };
  stress_patterns: Array<{
    day_of_week: string;
    avg_stress: number;
    meeting_count: number;
  }>;
}

// Organization/Teams types
export interface Organization {
  id: string;
  name: string;
  plan_tier: PlanTier;
  created_at: string;
}

export interface TeamMember {
  id: string;
  email: string;
  joined_at: string;
}

export interface TeamDashboard {
  total_active_users: number;
  avg_mood: number;
  avg_stress: number;
  avg_burnout_score: number;
  checkin_rate: number; // percentage
  week_data: Array<{
    week_start: string;
    avg_mood: number;
    avg_stress: number;
    checkin_count: number;
  }>;
}

export interface InviteTeamMemberRequest {
  email: string;
}

// AI Engine request/response types
export interface BurnoutScoreRequest {
  user_id: string;
  checkins_14d: CheckIn[];
  calendar_density: number;
  checkin_rate: number;
}

export interface BurnoutScoreResponse {
  score: number;
  risk_level: RiskLevel;
  factors: Record<string, any>;
}

export interface InterventionRecommendationRequest {
  user_id: string;
  current_stress: number;
  time_of_day: string;
  calendar_gap_minutes: number;
  past_ratings: Array<{
    intervention_id: string;
    rating: number; // 1-5
  }>;
}

export interface InterventionRecommendationResponse {
  interventions: InterventionRecommendation[];
}

export interface JournalProcessRequest {
  user_id: string;
  audio_base64?: string;
  text?: string;
}

export interface JournalProcessResponse {
  transcript?: string;
  summary: string;
  themes: string[];
  sentiment: number; // -1.0 to 1.0
}

export interface InsightGenerationRequest {
  user_id: string;
  week_summary: {
    mood_avg: number;
    burnout_delta: number;
    top_stressors: string[];
    checkin_rate: number;
  };
}

export interface InsightGenerationResponse {
  insight: string;
}

// API Error types
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
}

// Pagination types
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// Queue job types
export interface CheckInSubmittedJob {
  type: 'checkin.submitted';
  user_id: string;
  check_in_id: string;
}

export interface JournalProcessJob {
  type: 'journal.process';
  user_id: string;
  journal_entry_id: string;
  audio_path?: string;
}

export interface UserDeletionJob {
  type: 'user.deletion';
  user_id: string;
}

export interface AudioPurgeJob {
  type: 'audio.purge';
  journal_entry_id: string;
  s3_key: string;
}
