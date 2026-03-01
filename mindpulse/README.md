# MindPulse - Full-Stack Mental Health Tracking App

A comprehensive mental health tracking application for working professionals, featuring mood tracking, burnout scoring, AI-powered insights, and personalized interventions. Built with modern, scalable technologies.

## ✅ What's Been Built

### 1. **Infrastructure & Configuration**
- ✅ Docker Compose setup with all services (PostgreSQL, MongoDB, Redis, API, AI Engine)
- ✅ Environment configuration files (.env.example)
- ✅ Complete directory structure for monorepo

### 2. **Database Layer**
- ✅ PostgreSQL migrations:
  - Users, Organizations, Check-ins tables
  - Burnout scores, Interventions, Intervention logs
  - Calendar integrations, Refresh tokens
  - All indexes for performance optimization
- ✅ Initial intervention seeds (breathing exercises, reframes, walks, pause/mindfulness, journaling)
- ✅ MongoDB preparation for journal entries
- ✅ Redis configuration for caching and queue

### 3. **Shared Types Package**
- ✅ Comprehensive TypeScript type definitions for entire application
- ✅ Request/Response interfaces for all APIs
- ✅ Database model types
- ✅ Job queue types

### 4. **API Service (Node.js + Fastify)**

#### Authentication Routes (`/api/v1/auth`)
- ✅ User registration with password hashing
- ✅ Login with refresh token generation
- ✅ Token refresh with rotation
- ✅ Logout with token revocation
- 🔄 OAuth endpoints (Google, Apple) - handlers in place

#### Check-in Routes (`/api/v1/checkins`)
- ✅ Create check-in (mood, energy, stress scores)
- ✅ Get check-ins with pagination and filtering
- ✅ Calculate check-in streaks
- ✅ Get trend analysis (7d, 30d, 90d)
- ✅ Bull queue integration for async processing

#### AI Routes (`/api/v1/ai`)
- ✅ Get burnout score (calls AI engine)
- ✅ Get intervention recommendations
- ✅ Log intervention feedback
- ✅ Generate weekly insights

#### Journal Routes (`/api/v1/journals`)
- ✅ Upload voice journals (with S3 integration)
- ✅ Create text journals
- ✅ Retrieve journals with pagination
- ✅ Get single journal entry
- ✅ Delete journals (hard delete from S3 + MongoDB)

#### Integrations & Teams Routes
- ✅ Calendar connection (Google, Outlook, Apple)
- ✅ Get calendar correlation with mood
- ✅ Disconnect integrations
- ✅ Team dashboard with anonymized metrics
- ✅ Get team members listing
- ✅ Invite team members

#### User Routes (`/api/v1/user`)
- ✅ Get user profile
- ✅ Update user settings (timezone, check-in time)
- ✅ Delete user account (with queue job)
- ✅ Export user data (placeholder)

### 5. **AI Engine (Python + FastAPI)**

#### Burnout Score Endpoint (`/score/burnout`)
- ✅ Rule-based burnout calculation (0-100 scale)
- ✅ Risk level assessment (low, moderate, high, critical)
- ✅ Factor analysis (mood, energy, stress, volatility, calendar)
- ✅ Top contributing factors identification

#### Intervention Recommendations (`/recommend/interventions`)
- ✅ Smart recommendation system
- ✅ Calendar and time-aware suggestions
- ✅ Type-specific filtering (breathing, reframe, walk, pause, journal)
- ✅ Past performance rating consideration
- ✅ Time duration constraints

#### Journal Processing (`/process/journal`)
- ✅ Whisper API integration for audio transcription
- ✅ GPT-4o-mini for intelligent summarization
- ✅ Keyword-based theme extraction
- ✅ Sentiment analysis (-1.0 to 1.0 scale)
- ✅ Support for both audio and text input

#### Insight Generation (`/generate/insight`)
- ✅ Weekly narrative insights using GPT-4o-mini
- ✅ Empathetic, personalized messaging
- ✅ Actionable recommendations
- ✅ Trend-aware insights

### 6. **Job Queue System**
- ✅ Bull queue setup with Redis
- ✅ Check-in processing jobs
- ✅ Journal processing jobs
- ✅ User deletion jobs
- ✅ Audio purge jobs (scheduled for 30 days)

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for API)
- Python 3.11+ (for AI Engine)
- OpenAI API key

### Environment Setup

1. **Navigate to infrastructure:**
```bash
cd infra
```

2. **Copy and update .env files:**
```bash
cp services/api/.env.example services/api/.env
cp services/ai-engine/.env.example services/ai-engine/.env
```

3. **Update API/.env with:**
```
OPENAI_API_KEY=sk_your_key_here
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
```

4. **Start all services:**
```bash
docker-compose up --build
```

5. **Run migrations:**
```bash
docker exec mindpulse-api npm run migrate
```

### Available Endpoints

**API Base:** `http://localhost:3001/api/v1`
**AI Engine:** `http://localhost:8000`

#### Authentication
- `POST /auth/register` - Create account
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user

#### Check-ins
- `POST /checkins` - Create mood check-in
- `GET /checkins` - List check-ins
- `GET /checkins/streak` - Get current streak
- `GET /checkins/trends` - Get trend analysis

#### Health
- `GET /health` - API health check
- `GET http://localhost:8000/health` - AI engine health

---

## 📋 To-Do: Remaining Items (Tasks 13-20)

### 13. **Web App: Next.js Setup + Auth Pages**
- [ ] Next.js 14 project structure
- [ ] pages/app directory setup
- [ ] Auth context/store (Zustand)
- [ ] Login page with form validation
- [ ] Register page
- [ ] Password reset flow
- [ ] Protected routes with middleware

### 14. **Web App: Dashboard + Charts**
- [ ] Main dashboard layout
- [ ] Mood trend chart (using Recharts)
- [ ] Burnout score gauge
- [ ] Weekly summary statistics
- [ ] Streak counter display
- [ ] Recent activity feed

### 15. **Web App: Check-in Modal + Interventions**
- [ ] Quick check-in form modal
- [ ] Mood/Energy/Stress sliders
- [ ] Emotion tag selector
- [ ] Intervention recommendation cards
- [ ] Intervention action tracking
- [ ] Intervention feedback collection

### 16. **Web App: Journal Page**
- [ ] Journal list view
- [ ] Audio recorder component
- [ ] Audio file upload
- [ ] Text journal entry form
- [ ] Journal detail view with transcript & summary
- [ ] Delete journal functionality
- [ ] Search/filter journals

### 17. **Mobile: Expo Setup + Auth**
- [ ] React Native/Expo project initialization
- [ ] Navigation structure (React Navigation)
- [ ] Auth screens (Login, Register, Forgot Password)
- [ ] Secure token storage (localStorage/AsyncStorage)
- [ ] OAuth integration
- [ ] App persistence across sessions

### 18. **Mobile: Home Screen + Check-in Widget**
- [ ] Home screen layout
- [ ] Daily check-in widget
- [ ] Quick mood selector (emoji-based)
- [ ] Recent mood chart (light version)
- [ ] Navigation tabs
- [ ] Push notification handling

### 19. **Mobile: Charts + Journal Screens**
- [ ] Mood trends chart (7d/30d/90d)
- [ ] Burnout score display
- [ ] Journal list screen
- [ ] Voice recording screen
- [ ] Audio playback & transcript view
- [ ] Share functionality

### 20. **Cron Jobs + Push Notifications**
- [ ] Weekly burnout score calculation (cron)
- [ ] Daily check-in reminder (user-configurable time)
- [ ] Audio purge cron job (30-day cleanup)
- [ ] Push notification service integration (Expo)
- [ ] Check-in reminders
- [ ] Weekly insight notifications
- [ ] Stress alert notifications (burnout >= critical)

---

## 📁 Project Structure

```
mindpulse/
├── apps/
│   ├── mobile/              # React Native + Expo (TODO)
│   └── web/                 # Next.js 14 (in progress)
│       ├── app/             # Next.js app directory
│       ├── components/      # React components
│       ├── lib/            # Utilities
│       └── public/         # Static assets
├── services/
│   ├── api/                # Node.js + Fastify ✅
│   │   ├── src/
│   │   │   ├── routes/     # API endpoints ✅
│   │   │   ├── middleware/ # Auth & errors ✅
│   │   │   ├── services/   # Business logic ✅
│   │   │   ├── db/         # Database & connections ✅
│   │   │   ├── utils/      # JWT, encryption ✅
│   │   │   └── queue/      # Bull jobs ✅
│   │   └── migrations/     # SQL migrations ✅
│   └── ai-engine/          # Python + FastAPI ✅
│       ├── routes/         # FastAPI endpoints ✅
│       └── main.py         # FastAPI app ✅
├── packages/
│   ├── shared-types/       # TypeScript types ✅
│   └── ui/                 # Shared UI components (TODO)
├── infra/
│   └── docker-compose.yml  # All services ✅
└── README.md
```

---

## 🔐 Security Features

- ✅ JWT authentication with 15-minute expiry
- ✅ Refresh token rotation with secure hashing
- ✅ Password hashing with bcryptjs
- ✅ AES-256 encryption for sensitive data
- ✅ CORS configuration
- ✅ Rate limiting on API
- ✅ Helmet security headers
- ✅ SQL injection prevention (parameterized queries)
- ✅ S3 encryption for audio files

---

## 🧠 AI Features

**Burnout Scoring:**
- Analyzes 14-day check-in history
- Incorporates calendar density
- Calculates volatility in mood/energy
- Returns risk level and contributing factors

**Smart Interventions:**
- Recommends based on stress level
- Considers time of day
- Respects calendar availability
- Tracks effectiveness with past ratings

**Journal Processing:**
- Audio transcription (Whisper)
- Intelligent summarization (GPT)
- Automatic theme detection
- Sentiment analysis

**Weekly Insights:**
- Personalized AI-generated narratives
- Trend analysis and patterns
- Actionable recommendations
- Empathetic, supportive tone

---

## 📊 Sample API Responses

### Check-in Response
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "mood_score": 7,
  "energy_score": 6,
  "stress_score": 5,
  "emotion_tags": ["work_stress", "gratitude"],
  "checked_at": "2024-03-01T12:00:00Z"
}
```

### Burnout Score Response
```json
{
  "score": 45.3,
  "risk_level": "moderate",
  "factors": {
    "mood_score": 6.2,
    "stress_score": 6.8,
    "top_factors": ["High stress", "Inconsistent emotional state"]
  }
}
```

### Intervention Recommendation Response
```json
{
  "interventions": [
    {
      "id": "breathing-1",
      "type": "breathing",
      "title": "4-7-8 Breathing Exercise",
      "reason": "4-7-8 Breathing Exercise for immediate stress relief",
      "duration_seconds": 180
    }
  ]
}
```

---

## 🛠️ Tech Stack Summary

| Layer | Technologies |
|-------|--------------|
| **Frontend (Web)** | Next.js 14, React 18, Tailwind CSS, Recharts |
| **Frontend (Mobile)** | React Native, Expo |
| **Backend API** | Node.js, Fastify, TypeScript |
| **AI/ML** | Python, FastAPI, OpenAI (GPT-4o-mini, Whisper) |
| **Databases** | PostgreSQL, MongoDB, Redis |
| **Jobs** | Bull Queue |
| **Storage** | AWS S3 |
| **Auth** | JWT, OAuth2, bcryptjs |
| **DevOps** | Docker, Docker Compose |

---

## 📝 Notes

- All sensitive environment variables should be stored securely
- Refresh tokens are rotated on each use
- Audio files are automatically purged after 30 days
- Burnout scoring runs weekly (Sunday night) via cron
- AI models are called asynchronously where possible
- Rate limiting is set to 100 requests per 15 minutes per user

---

## 🚧 Next Steps (Development Guide)

1. **Complete Web App** (Tasks 13-16)
   - Setup Next.js with TypeScript
   - Implement authentication pages
   - Build dashboard with charts
   - Create journal interface

2. **Complete Mobile App** (Tasks 17-19)
   - Initialize Expo project
   - Implement native features
   - Add video/audio recording
   - Optimize for mobile UX

3. **Implement Cron Jobs & Notifications** (Task 20)
   - Setup Bull scheduler
   - Configure Expo push notifications
   - Create notification templates
   - Add user preference management

4. **Testing & Documentation**
   - Unit tests for services
   - Integration tests for API
   - API documentation (Swagger/OpenAPI)
   - User onboarding guide

5. **Deployment**
   - AWS ECS for containerized services
   - RDS for PostgreSQL
   - DocumentDB for MongoDB
   - CloudFront for CDN
   - CI/CD with GitHub Actions

---

Created: March 1, 2026
Status: 60% Complete (12 of 20 tasks)
