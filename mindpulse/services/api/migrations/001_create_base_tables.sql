-- Migration: 001_create_base_tables.sql
-- Description: Create base schema for organizations, users, and core tables

-- Create ENUM types
CREATE TYPE plan_tier AS ENUM ('free', 'pro', 'teams');
CREATE TYPE risk_level_enum AS ENUM ('low', 'moderate', 'high', 'critical');
CREATE TYPE intervention_type AS ENUM ('breathing', 'reframe', 'walk', 'pause', 'journal');
CREATE TYPE oauth_provider AS ENUM ('google', 'outlook', 'apple');

-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  plan_tier plan_tier DEFAULT 'teams',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  plan_tier plan_tier DEFAULT 'free',
  timezone VARCHAR(50) DEFAULT 'UTC',
  checkin_time TIME DEFAULT '12:00:00',
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create refresh_tokens table
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create check_ins table
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood_score SMALLINT NOT NULL CHECK(mood_score BETWEEN 1 AND 10),
  energy_score SMALLINT NOT NULL CHECK(energy_score BETWEEN 1 AND 10),
  stress_score SMALLINT NOT NULL CHECK(stress_score BETWEEN 1 AND 10),
  emotion_tags TEXT[] DEFAULT '{}',
  duration_ms INT,
  checked_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create burnout_scores table
CREATE TABLE burnout_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL CHECK(score BETWEEN 0 AND 100),
  risk_level risk_level_enum NOT NULL,
  factors JSONB DEFAULT '{}',
  week_start DATE NOT NULL,
  computed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create interventions table
CREATE TABLE interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type intervention_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_seconds INT,
  content JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create intervention_logs table
CREATE TABLE intervention_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  intervention_id UUID NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
  triggered_stress_score SMALLINT,
  post_mood_delta SMALLINT,
  completed BOOLEAN DEFAULT FALSE,
  logged_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create calendar_integrations table
CREATE TABLE calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider oauth_provider NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  connected_at TIMESTAMP DEFAULT NOW(),
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_checkins_user_id ON check_ins(user_id);
CREATE INDEX idx_checkins_checked_at ON check_ins(checked_at);
CREATE INDEX idx_burnout_scores_user_id ON burnout_scores(user_id);
CREATE INDEX idx_burnout_scores_week_start ON burnout_scores(week_start);
CREATE INDEX idx_intervention_logs_user_id ON intervention_logs(user_id);
CREATE INDEX idx_calendar_integrations_user_id ON calendar_integrations(user_id);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
