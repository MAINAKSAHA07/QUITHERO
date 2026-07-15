# Smono - Quit smoking recovery app

A comprehensive addiction recovery app built with React, TypeScript, and Tailwind CSS, featuring a beautiful glassmorphism design and PocketBase backend.

## 🚀 Features

- **Glassmorphism UI Design** - Modern, premium glass-effect interface
- **10-Day Program** - Structured daily sessions with progress tracking
- **Craving Support** - Instant help when cravings strike
- **Progress Tracking** - Visual analytics and achievements
- **Journal** - Personal reflection and mood tracking
- **Multi-step Onboarding** - Personalized 7-step KYC flow with archetype assignment
- **Quit Archetypes** - AI-powered personality profiling (Escapist, Stress Reactor, Social Mirror, Auto-Pilot)
- **PocketBase Backend** - Docker-based backend with SQLite database

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS with custom glassmorphism utilities
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Build Tool**: Vite
- **Backend**: PocketBase (Docker)
- **Database**: SQLite (via PocketBase)

## 📦 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose

### Installation

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Setup PocketBase with Docker**
   ```bash
   # Using the setup script (recommended)
   npm run setup
   
   # Or manually
   docker-compose up -d
   ```

3. **Configure PocketBase**
   - Open http://localhost:8095/_/ in your browser
   - Create an admin account (first time only)
   - Create the required collections (see [SETUP.md](./SETUP.md))

4. **Start the development server**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5175`

## 📱 Screens

1. **Splash Screen** - Animated intro
2. **Language Selection** - Multi-language support
3. **Onboarding** - 4-screen carousel introduction
4. **Authentication** - Login & Sign Up with PocketBase
5. **KYC Flow** - 7-step personalized onboarding:
   - Personal Info (age, gender, language)
   - Addiction Details (nicotine forms, daily consumption, years using)
   - Trigger Selection (multi-select smoking triggers)
   - Emotional States (emotions linked to smoking)
   - Fear Index (0-10 health concern scale)
   - Motivation (preset categories + free-text quit reason)
   - Reminder Settings (time preferences)
   - **Auto-assigns Quit Archetype** based on user responses
6. **Home Dashboard** - Stats cards, quick actions, motivational content
7. **Sessions List** - 10-day program overview
8. **Session Detail** - Step-by-step content (text, video, questions, exercises)
9. **Craving Support** - Emergency help with logging
10. **Progress** - Analytics, charts, achievements, health milestones
11. **Journal** - Mood tracking with add/edit/delete
12. **Profile** - Settings, notifications, account management

## 🎨 Design System

### Colors
- **Brand Primary**: `#F58634` (Orange)
- **Brand Accent**: `#D45A1C` (Deep Orange)
- **Brand Light**: `#FFD08A` (Flame Yellow)
- **Text Primary**: `#2B2B2B` (Charcoal)
- **Background**: `#FFF7EE` (Soft Sand)
- **Success**: `#4CAF50`
- **Info**: `#2A72B5`
- **Error**: `#E63946`

### Glass Components
- `.glass` - Standard glass card
- `.glass-strong` - Enhanced glass with more blur
- `.glass-subtle` - Subtle glass effect
- `.glass-button-primary` - Primary gradient button
- `.glass-button-secondary` - Secondary glass button
- `.glass-input` - Glass-styled input field

## 🌐 Ports

- **React App**: `http://localhost:5175` (Vite dev server)
- **Admin Dashboard**: `http://localhost:5176` (Backoffice - see below)
- **PocketBase**: `http://localhost:8095` (Backend API)
- **PocketBase Admin**: `http://localhost:8095/_/` (Admin UI)

## 🐳 Docker Commands

```bash
# Start PocketBase
npm run pb:start
# or
docker-compose up -d

# Stop PocketBase
npm run pb:stop
# or
docker-compose down

# View logs
npm run pb:logs
# or
docker-compose logs -f pocketbase

# Restart PocketBase
npm run pb:restart
# or
docker-compose restart pocketbase
```

## 📝 Available Scripts

- `npm run dev` - Start development server (main app)
- `npm run dev:backoffice` - Start admin dashboard
- `npm run dev:all` - Start both main app and admin dashboard (requires `concurrently`)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run setup` - Setup PocketBase with Docker
- `npm run pb:start` - Start PocketBase
- `npm run pb:stop` - Stop PocketBase
- `npm run pb:logs` - View PocketBase logs
- `npm run pb:restart` - Restart PocketBase

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# PocketBase URL (default: http://localhost:8095)
VITE_POCKETBASE_URL=http://localhost:8095

# PocketBase Encryption Key (generate a random 32-character string)
PB_ENCRYPTION_KEY=your-secret-encryption-key-here
```

## 🎛️ Admin Dashboard (Backoffice)

The project includes a comprehensive admin dashboard for managing users, content, analytics, and system settings.

### Features

- **User Management**: View, search, filter, and manage all registered users
- **Content Management**: Manage programs, days, steps, articles, quotes, and media library
- **Support & Engagement**: Handle support tickets, flagged cravings, and journal entries
- **Analytics & Reports**: Comprehensive analytics dashboards and custom reports
- **Achievements**: Manage achievements and view unlock logs
- **Settings**: Configure app settings, notification templates, admin users, roles, and permissions

### Getting Started with Admin Dashboard

1. **Install dependencies**:
   ```bash
   cd backoffice
   npm install
   ```

2. **Start the admin dashboard**:
   ```bash
   npm run dev:backoffice
   # or from root directory:
   npm run dev:backoffice
   ```

3. **Access the dashboard**:
   - URL: `http://localhost:5176`
   - Login with an admin account (user must have `role` field set to `admin`, `super_admin`, `content_manager`, `support_agent`, or `analyst`)

### Running Both Apps

To run both the main app and admin dashboard simultaneously:

```bash
# Option 1: Run separately in different terminals
npm run dev              # Terminal 1: Main app (port 5175)
npm run dev:backoffice   # Terminal 2: Admin dashboard (port 5176)

# Option 2: Run both together (requires concurrently package)
npm run dev:all
```

For more details, see [backoffice/README.md](./backoffice/README.md)

## 📚 Documentation

- [SETUP.md](./SETUP.md) - Detailed setup instructions and PocketBase collections configuration
- [backoffice/README.md](./backoffice/README.md) - Admin dashboard documentation
- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide (if exists)

## 🧭 Navigation

- **Bottom Navigation**: Fixed 5-tab navigation (Home, Sessions, Support FAB, Progress, Profile)
- **Top Navigation**: Context-sensitive header with back/menu/actions

## 🎯 Onboarding & Personalization System

### Quit Archetypes

The app automatically assigns users to one of four personality archetypes based on their smoking triggers and emotional states:

#### 🌊 The Escapist
- **Profile**: Smokes when bored or seeking distraction
- **Triggers**: Boredom, loneliness
- **Emotional States**: Bored, lonely, sad
- **Intervention**: Alternative activities, emotional coping, mindfulness

#### ⚡ The Stress Reactor
- **Profile**: Smokes in response to stress and pressure
- **Triggers**: Stress, anxiety
- **Emotional States**: Stressed, anxious, angry
- **Intervention**: Stress management, breathing exercises, healthy outlets

#### 👥 The Social Mirror
- **Profile**: Heavily influenced by social situations
- **Triggers**: Social situations, celebrations
- **Emotional States**: Happy, excited (around others)
- **Intervention**: Social support networks, alternative social habits

#### 🔄 The Auto-Pilot Smoker
- **Profile**: Smokes out of habit and routine
- **Triggers**: Habits, routines, specific times/places
- **Emotional States**: Default when no clear pattern
- **Intervention**: Routine disruption, habit replacement

### Archetype Assignment Algorithm

The system uses a scoring algorithm to determine the user's archetype:

1. **Trigger Scoring** (+3 points each):
   - Stress → Stress Reactor
   - Boredom → Escapist
   - Social → Social Mirror
   - Habit → Auto-Pilot

2. **Emotional State Scoring** (+1-2 points each):
   - Stressed/Anxious (+2) → Stress Reactor
   - Bored/Lonely (+2) → Escapist
   - Happy/Excited (+1) → Social Mirror
   - Angry (+1) → Stress Reactor
   - Sad (+1) → Escapist

3. **Assignment**: Archetype with highest score wins
4. **Default**: Auto-Pilot if no clear winner

### Database Schema

**New Fields in `user_profiles`**:
- `smoking_triggers` (JSON) - Array of trigger types
- `emotional_states` (JSON) - Array of emotional states
- `fear_index` (Number 0-10) - Health concern level
- `quit_reason` (Text) - Free-text quit motivation
- `quit_archetype` (Select) - Auto-assigned personality type

### Migration

For existing databases, run the migration script:
```bash
cd PocketBase
node migrate-user-profiles.js
```

This adds the new fields without affecting existing data.

## 🌍 Translation & Internationalization

### Supported Languages

The app supports **9 languages** with automatic translation (single source of truth: [`frontend/constants/languages.ts`](frontend/constants/languages.ts)):

| Code | Language | KYC label |
|------|----------|-----------|
| `en` | English | English |
| `hi` | हिंदी (Hindi) | Hindi |
| `mr` | मराठी (Marathi) | Marathi |
| `gu` | ગુજરાતી (Gujarati) | Gujarati |
| `es` | Español | Español |
| `fr` | Français | Français |
| `de` | Deutsch | Deutsch |
| `it` | Italiano | Italiano |
| `zh` | 中文 (Chinese) | 中文 |

### How Translation Works

The app uses **Google Translate's public web API** for real-time translation (no API key):

1. **Language Context**: Global language state in `AppContext` (`app_language` in localStorage)
2. **Translation Service**: Automatic translation with caching ([`translation.service.ts`](frontend/services/translation.service.ts))
3. **TranslatedText Component**: Wrap any text to auto-translate ([`TranslatedText.tsx`](frontend/components/TranslatedText.tsx))
4. **Language pickers**: [`LanguageModal.tsx`](frontend/components/LanguageModal.tsx) (signup) and [`LanguageSelection.tsx`](frontend/screens/LanguageSelection.tsx) (route `/language`)

### Wiring Checklist

Use this to verify multilingual is connected end-to-end:

| Step | Where | What happens |
|------|-------|--------------|
| 1 | `constants/languages.ts` | All 9 languages defined once; dev assert ensures list matches `Language` enum |
| 2 | Sign up | `SignUp.tsx` opens `LanguageModal` → `setLanguage` + saves to `user_profiles.language` |
| 3 | KYC onboarding | Language question options come from `KYC_LANGUAGE_OPTIONS`; `KYCFlow` maps selection via `LANGUAGE_BY_KYC_LABEL` |
| 4 | Profile sync | `AppContext` syncs `userProfile.language` → app language on load; backfills profile if missing |
| 5 | Change language | Profile row or sidebar → `/language?from=…` → same save path as modal |
| 6 | UI translation | `TranslatedText` / `useTranslation` call `translation.service` with current language from context |
| 7 | Cache reset | Language change clears translation cache (modal, `/language` screen) |

**Manual smoke test:**
1. Sign up → pick Hindi in modal → confirm UI strings translate
2. Complete KYC → choose Marathi → finish → confirm profile shows मराठी and UI updates
3. Profile → Language → pick Gujarati → confirm persistence after refresh
4. DevTools → Application → localStorage `app_language` matches profile

**Known gaps:**
- Login does **not** show the language modal (signup only); returning users rely on profile/localStorage
- Translation requires outbound access to `translate.googleapis.com` from the browser

### Implementation Guide

#### Method 1: Using TranslatedText Component (Recommended)

Wrap text content with the `TranslatedText` component:

```tsx
import TranslatedText from '../components/TranslatedText'

<h1>
  <TranslatedText text="Welcome to smono" />
</h1>

<p>
  <TranslatedText text="Start your journey today" />
</p>
```

#### Method 2: Using useTranslation Hook

For dynamic content or programmatic translation:

```tsx
import { useTranslation } from '../hooks/useTranslation'

function MyComponent() {
  const { t, currentLanguage } = useTranslation()

  const translateText = async () => {
    const translated = await t('Hello World', 'en')
    console.log(translated)
  }

  return <div>{/* ... */}</div>
}
```

#### Method 3: Batch Translation

For multiple texts at once:

```tsx
const { translateBatch } = useTranslation()

const texts = ['Home', 'Profile', 'Settings']
const translated = await translateBatch(texts, 'en')
```

### Language Selection Flow

**On signup:**
1. User completes signup
2. **Language modal appears** (`SignUp.tsx` → `LanguageModal`)
3. User selects preferred language (all 9 from `APP_LANGUAGES`)
4. Language saved to `localStorage` (`app_language`) and `user_profiles.language`
5. App content translates via `TranslatedText` / `useTranslation`

**During KYC:**
- Onboarding asks language preference using the same 9 options
- Selection is mapped to profile `language` code on completion

**Changing language later:**
- Profile → Language row → `/language?from=/profile`
- Sidebar → Language → `/language?from=<current path>`
- Changes apply immediately; translation cache is cleared

### Translation Features

- **Automatic Caching**: Translations cached to reduce API calls
- **Offline Fallback**: Original text shown if translation fails
- **Real-time Updates**: UI updates instantly when language changes
- **Profile Sync**: Language preference synced with user profile
- **Analytics**: Language change events tracked

### Adding New Languages

1. Add code to `Language` enum in `frontend/types/enums.ts`
2. Add one entry to `APP_LANGUAGES` in `frontend/constants/languages.ts` (include `kycLabel`)
3. Dev assert in `languages.ts` will fail if enum and picker list drift — fix until it passes
4. Ensure PocketBase `user_profiles.language` field accepts the new code (text/select values)

### Files Reference

**Core Translation Files:**
- [`/frontend/constants/languages.ts`](frontend/constants/languages.ts) - Single source of truth for all language pickers + KYC
- [`/frontend/services/translation.service.ts`](frontend/services/translation.service.ts) - Translation API service
- [`/frontend/hooks/useTranslation.ts`](frontend/hooks/useTranslation.ts) - Translation React hook
- [`/frontend/components/TranslatedText.tsx`](frontend/components/TranslatedText.tsx) - Auto-translate component
- [`/frontend/components/LanguageModal.tsx`](frontend/components/LanguageModal.tsx) - Language selection popup (signup)
- [`/frontend/screens/LanguageSelection.tsx`](frontend/screens/LanguageSelection.tsx) - Full-screen selector at `/language`
- [`/frontend/context/AppContext.tsx`](frontend/context/AppContext.tsx#L36-L72) - Language state + profile sync

**Auth & onboarding:**
- [`/frontend/screens/auth/SignUp.tsx`](frontend/screens/auth/SignUp.tsx) - Shows language modal after signup
- [`/frontend/screens/kyc/kycQuestions.ts`](frontend/screens/kyc/kycQuestions.ts) - KYC language question (uses `KYC_LANGUAGE_OPTIONS`)
- [`/frontend/screens/kyc/KYCFlow.tsx`](frontend/screens/kyc/KYCFlow.tsx) - Maps KYC answer → profile language code

### Best Practices

1. **Use TranslatedText for static content**: Wrap all user-facing text
2. **Keep source text in English**: Use `sourceLang='en'` as default
3. **Provide fallbacks**: Use `fallback` prop for critical text
4. **Cache management**: Translation service auto-caches, clear on language change
5. **Error handling**: Service gracefully falls back to original text on errors

### Translation Coverage

Current implementation includes automatic translation for:
- ✅ All navigation elements
- ✅ Home screen content
- ✅ Profile screen
- ✅ Progress screen
- ✅ Journal entries
- ✅ Craving support
- ✅ Session content (program days/steps)
- ✅ Onboarding (KYC flow)
- ✅ Settings and modals

**Note**: To enable translation on any new screen, simply wrap text with `<TranslatedText text="Your text here" />`.

## 🔮 Future Features

- **Archetype-Based Customization**:
  - Personalized notification tones
  - Targeted craving scripts
  - Custom post-quit recovery paths
  - Tailored daily program content

- Social features and community
- Gamification (badges, leaderboards)
- AI/ML features (advanced recommendations)
- Health integrations (Apple Health, Google Fit)
- Premium subscription tier
- Additional language support (Arabic, Portuguese, Japanese)

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
