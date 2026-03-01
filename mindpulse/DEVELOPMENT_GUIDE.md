# MindPulse Development Completion Guide

## Current Status
**60% Complete** - Infrastructure, APIs, and AI engine fully implemented

## Remaining Tasks Breakdown

---

## Task 13: Web App - Next.js Setup + Auth Pages [IN PROGRESS]

### ✅ Completed
- Next.js 14 configuration
- Tailwind CSS setup with custom theme
- TypeScript configuration
- Auth Zustand store with token management
- API client with axios interceptors
- Global layouts and styles
- Login page with form validation

### 📋 Remaining Work

#### 13a. Register Page
**File:** `apps/web/app/auth/register/page.tsx`

```typescript
// Key features:
- Email & password validation
- Password strength indicator
- Terms & conditions checkbox
- Auto-login after registration
- Loading states
- Error handling
```

#### 13b. Forgot Password Flow
**File:** `apps/web/app/auth/forgot-password/page.tsx`

```typescript
// Step 1: Email submission
// Step 2: OTP/Email verification (TODO: backend)
// Step 3: New password entry
// Step 4: Success confirmation
```

#### 13c. Protected Routes Middleware
**File:** `apps/web/middleware.ts`

```typescript
// Use Next.js middleware to:
// - Redirect unauthenticated users to /auth/login
// - Check token validity on each request
// - Refresh tokens if needed
// - Redirect to /dashboard on successful auth
```

#### 13d. Auth Context Provider
**File:** `apps/web/components/AuthProvider.tsx`

```typescript
// Wrap app with provider to:
// - Restore auth state on app load
// - Make auth available to all components
// - Handle logout everywhere
```

---

## Task 14: Web App - Dashboard + Charts

### Files to Create

#### 14a. Dashboard Page
**File:** `apps/web/app/dashboard/page.tsx`

```typescript
// Components:
- Header with user profile
- Quick stats (current mood, burnout level, streak)
- Mood trend chart (7-day)
- Recent activities
- Quick action buttons
```

#### 14b. Mood Trend Chart Component
**File:** `apps/web/components/MoodTrendChart.tsx`

```typescript
// Use Recharts to display:
- Line chart for mood scores
- Color coding (red=bad, yellow=neutral, green=good)
- Interactive tooltips
- Toggle between 7d/30d/90d views
```

#### 14c. Burnout Score Gauge
**File:** `apps/web/components/BurnoutGauge.tsx`

```typescript
// Display features:
- Circular gauge (0-100)
- Color-coded risk level
- Most impactful factors
- Trend indicator (↑ ↓ →)
```

#### 14d. Statistics Card Components
**File:** `apps/web/components/StatsCard.tsx`

```typescript
// Reusable card showing:
- Metric name
- Current value
- Change indicator
- Optional mini chart
```

---

## Task 15: Web App - Check-in Modal + Interventions

### Files to Create

#### 15a. Quick Check-in Modal
**File:** `apps/web/components/CheckInModal.tsx`

```typescript
// Features:
- Mood slider (1-10)
- Energy slider (1-10)
- Stress slider (1-10)
- Emotion tag selector (multi-select)
- Submit button
- On success: close & refresh data
```

#### 15b. Mood Slider Component
**File:** `apps/web/components/MoodSlider.tsx`

```typescript
// Features:
- Visual slider with emoji feedback
- Real-time value display
- Accessibility support
- Smooth animations
```

#### 15c. Intervention Cards
**File:** `apps/web/components/InterventionCard.tsx`

```typescript
// Display:
- Intervention type icon
- Title & reason
- Duration (in minutes)
- Start button
- Rating after completion (1-5 stars)
```

#### 15d. Intervention Player
**File:** `apps/web/components/InterventionPlayer.tsx`

```typescript
// Features:
- Timer display
- Step-by-step instructions
- Audio/voice guidance (if available)
- Completion tracking
- Post-intervention mood check
```

---

## Task 16: Web App - Journal Page

### Files to Create

#### 16a. Journal List Page
**File:** `apps/web/app/dashboard/journals/page.tsx`

```typescript
// Features:
- Grid/list view toggle
- Search & filter
- Date range filter
- Sentiment color coding
- Themes displayed on cards
- Quick preview on hover
```

#### 16b. Audio Recorder Component
**File:** `apps/web/components/AudioRecorder.tsx`

```typescript
// Features:
- Browser audio API integration
- Recording time display
- Play/pause controls
- Re-record option
- Upload button
- Uploading progress indicator
```

#### 16c. Voice Journal Creator
**File:** `apps/web/app/dashboard/journals/new-voice/page.tsx`

```typescript
// Workflow:
1. Quick mood selector
2. Record/upload audio
3. Preview transcription
4. Edit if needed
5. Submit
```

#### 16d. Text Journal Creator
**File:** `apps/web/app/dashboard/journals/new-text/page.tsx`

```typescript
// Features:
- Rich text editor or plain textarea
- Auto-save to localStorage
- Word count
- Mood selector
- Submit button
```

#### 16e. Journal Detail View
**File:** `apps/web/app/dashboard/journals/[id]/page.tsx`

```typescript
// Display:
- Audio player (if voice journal)
- Full transcript
- AI summary
- Extracted themes
- Sentiment score visualization
- CreatedAt timestamp
- Delete button
```

---

## Task 17: Mobile App - Expo Setup + Auth

### Directory Structure
```
apps/mobile/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (app)/
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   └── _layout.tsx
├── components/
├── hooks/
├── lib/
├── services/
└── types/
```

### Files to Create

#### 17a. Expo Project Initialization
```bash
npx create-expo-app --template
cd apps/mobile
npx expo install
```

#### 17b. Navigation Setup
**File:** `apps/mobile/app/_layout.tsx`

```typescript
// Use Expo Router for:
- Tab navigation (home, check-ins, journal, profile)
- Stack navigation within tabs
- Auth flow management
```

#### 17c. Auth Screens
**Files:**
- `app/(auth)/login.tsx`
- `app/(auth)/register.tsx`
- `app/(auth)/forgot-password.tsx`

```typescript
// Use React Native components:
- TextInput for email/password
- TouchableOpacity for buttons
- ScrollView for layout
- ActivityIndicator for loading
```

#### 17d. Secure Token Storage
**File:** `lib/secureStorage.ts`

```typescript
// Use expo-secure-store:
- Save tokens securely after auth
- Retrieve on app startup
- Clear on logout
- Handle token refresh
```

---

## Task 18: Mobile App - Home Screen + Check-in Widget

### Files to Create

#### 18a. Home Screen
**File:** `app/(app)/index.tsx`

```typescript
// Components:
- Welcome message (personalized)
- Today's mood (if checked in)
- Quick check-in button (floating action button)
- Recent mood mini chart
- Recent activities
- Burnout level indicator
- Navigation tabs
```

#### 18b. Quick Check-in Widget
**File:** `components/QuickCheckIn.tsx`

```typescript
// Mobile-first features:
- Full-screen modal
- Emoji-based mood selector
- Tap to select mood/energy/stress
- Large, touch-friendly buttons
- Haptic feedback on selection
- Quick submit
```

#### 18c. Daily Reminder Notification
**File:** `services/notifications.ts`

```typescript
// Features:
- Request user permission
- Schedule notification for user's check-in time
- Update when user changes time preference
- Tap to open app & check-in
```

#### 18d. Recent Activities Feed
**File:** `components/RecentActivitiesFeed.tsx`

```typescript
// Display:
- Timeline of recent check-ins
- Journal entries created
- Interventions completed
- Mood trends
- Streak information
```

---

## Task 19: Mobile App - Charts + Journal Screens

### Files to Create

#### 19a. Charts Screen
**File:** `app/(app)/charts.tsx`

```typescript
// Sections:
- Period selector (7d/30d/90d)
- Mood trend line chart
- Energy bar chart
- Stress area chart
- Burnout score gauge
- Key statistics
```

#### 19b. Chart Components
**Files:**
- `components/MoodLineChart.tsx` (using react-native-gifted-charts)
- `components/EnergyChart.tsx`
- `components/ StressChart.tsx`

```typescript
// Features:
- Scroll to see full period
- Touch to see values
- Color-coded by mood
- Export as image option
```

#### 19c. Journal Screen
**File:** `app/(app)/journals.tsx`

```typescript
// Features:
- List of journals with thumbnails
- Date grouping (Today, This Week, This Month)
- Search articles
- Filter by type (voice/text)
- Pull-to-refresh
```

#### 19d. Journal Detail Screen
**File:** `app/(app)/journals/[id].tsx`

```typescript
// Features:
- Audio player (if voice journal)
- Full transcript
- AI summary highlighted
- Themes displayed
- Sentiment visualization
- Share options
- Delete option
```

#### 19e. Create Journal Screen
**File:** `app/(app)/create-journal.tsx`

```typescript
// Options:
- Voice vs Text selector
- If voice: audio recorder
- If text: text editor
- Mood selector
- Save button
```

---

## Task 20: Cron Jobs + Push Notifications

### Files to Create

#### 20a. Cron Job Setup
**File:** `services/api/src/jobs/cron.ts`

```typescript
// Use node-cron for:
// 1. Weekly burnout calc (Sundays at 11 PM)
// 2. Audio purge (daily at 2 AM)
// 3. Stale data cleanup (daily at 3 AM)

import cron from 'node-cron';

cron.schedule('0 23 * * 0', async () => {
  // Calculate burnout for all eligible users
});
```

#### 20b. Burnout Calculation Job
**File:** `services/api/src/jobs/burnoutCalculation.ts`

```typescript
// Logic:
- Get all users with plan_tier !== 'free' OR org_id
- For each user with 7+ checkins in past 14 days:
  - Call AI engine /score/burnout
  - Store result in burnout_scores table
  - Cache in Redis
  - If risk_level === 'critical': send alert notification
```

#### 20c. Daily Check-in Reminder Notifications
**File:** `services/api/src/jobs/dailyReminders.ts`

```typescript
// Logic:
- Get all active users by timezone
- For each user at their preferred checkin_time:
  - Check if they've already checked in today
  - If not: send push notification
  - Use Expo Push Notifications API
```

#### 20d. Audio Purge Job
**File:** `services/api/src/jobs/audioPurge.ts`

```typescript
// Logic:
- Get journals where audio_purge_at <= NOW()
- For each journal:
  - Delete audio from S3
  - Update MongoDB document
  - Log action
```

#### 20e. Expo Push Notification Service
**File:** `services/api/src/services/PushService.ts`

```typescript
// Methods:
- sendCheckInReminder(userId, timezone)
- sendWeeklyInsight(userId, insight)
- sendStressAlert(userId, burnoutLevel)
- sendInterventionReminder(userId)

// Features:
- Store push tokens from mobile app
- Batch notifications
- Respect user preferences
- Schedule future notifications
```

#### 20f. Push Token Management
**File:** `services/api/src/routes/push.ts`

```typescript
// Endpoints:
- POST /user/push-token (register/update token)
- DELETE /user/push-token (unregister)
- PUT /user/notification-preferences (opt-in/out)
```

#### 20g. Mobile Push Notification Handler
**File:** `apps/mobile/services/expoPush.ts`

```typescript
// Features:
- Register device token on app startup
- Handle incoming notifications
- Create handlers for different notification types
- Deep link when notification tapped
- Local notifications for offline scenarios
```

---

## Implementation Priority

### Phase 1: Core Web App (Week 1)
1. Task 13 (complete registration, protected routes)
2. Task 14 (dashboard with basic charts)
3. Task 15 (check-in functionality)

### Phase 2: Content Features (Week 2)
1. Task 16 (journal pages)
2. Task 14 (enhanced charts)
3. Test integration with backend

### Phase 3: Mobile App (Week 3-4)
1. Task 17 (project setup, auth)
2. Task 18 (home screen)
3. Task 19 (charts & journals)

### Phase 4: Automation (Week 5)
1. Task 20 (cron jobs, notifications)
2. Testing & optimization
3. Deployment preparation

---

## Testing Checklist

### Before Starting Each Task
- [ ] Backend endpoint documented
- [ ] Types defined in shared-types
- [ ] Mock data available
- [ ] Component design finalized

### During Development
- [ ] Component renders without errors
- [ ] All inputs validated
- [ ] Loading states shown
- [ ] Errors handled gracefully
- [ ] Data persists correctly

### Before Completion
- [ ] Full happy path tested
- [ ] Error scenarios tested
- [ ] Mobile responsive (web)
- [ ] Accessibility checked
- [ ] Performance optimized

---

## Common Implementation Patterns

### Web Data Fetching
```typescript
'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

export default function MyComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get('/endpoint');
        setData(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  return <div>{/* render data */}</div>;
}
```

### Mobile Lifecycle
```typescript
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function MyScreen() {
  useFocusEffect(
    useCallback(() => {
      // Refetch data when screen comes into focus
      return () => {
        // Cleanup
      };
    }, [])
  );
}
```

---

## API Integration Points

All remaining frontend features depend on these backend endpoints:

| Feature | Required Endpoint | Status |
|---------|-------------------|--------|
| Check-in | POST /checkins | ✅ Ready |
| Mood Chart | GET /checkins/trends | ✅ Ready |
| Burnout Score | GET /ai/burnout-score | ✅ Ready |
| Interventions | GET /ai/interventions, POST /ai/interventions/:id/feedback | ✅ Ready |
| Journals | POST/GET /journals | ✅ Ready |
| User Profile | GET/PUT /user/me | ✅ Ready |

All endpoints are fully functional and tested.

---

## Deployment Considerations

### Web App (Next.js)
- Build: `npm run build`
- Deploy to: Vercel, AWS Amplify, or self-hosted
- Env variables: API_URL, Auth config

### Mobile App (Expo)
- Build: `eas build`
- Publish: EAS Submit
- Env variables: API endpoint, Expo token

### Backend Services
- Already containerized with Docker
- Deploy to: ECS, Kubernetes, DigitalOcean App Platform
- Environment variables in `.env` (use secrets manager)

---

## Troubleshooting Guide

### Common Issues

**Token Refresh Loop**
- Check token expiration times
- Verify refresh endpoint status code handling
- Ensure cookies are set correctly

**CORS Errors**
- Verify API CORS settings match origin
- Check Authorization header format
- Test without credentials first

**Audio Upload Issues**
- Verify S3 permissions
- Check file size limits
- Ensure Content-Type is set

**Chart Rendering**
- Verify data is loaded before rendering
- Check for date formatting issues
- Ensure enough data points (>= 2)

---

## Resources

### Documentation
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Expo Docs](https://docs.expo.dev)
- [Fastify Docs](https://www.fastify.io)
- [FastAPI Docs](https://fastapi.tiangolo.com)

### Libraries
- [Recharts](https://recharts.org) - Charts
- [React Hot Toast](https://react-hot-toast.com) - Notifications
- [react-native-gifted-charts](https://github.com/JeswinSunsi/react-native-gifted-charts) - Mobile Charts
- [Zustand](https://github.com/pmndrs/zustand) - State management

---

**Last Updated:** March 1, 2026
**Estimated Completion:** 3-4 weeks for full implementation
