# Quit Hero - Addiction Recovery App

A comprehensive addiction recovery app built with React, TypeScript, and Tailwind CSS, featuring a beautiful glassmorphism design and PocketBase backend.

## 🚀 Features

- **Glassmorphism UI Design** - Modern, premium glass-effect interface
- **10-Day Program** - Structured daily sessions with progress tracking
- **Craving Support** - Instant help when cravings strike
- **Progress Tracking** - Visual analytics and achievements
- **Journal** - Personal reflection and mood tracking
- **Multi-step Onboarding** - Personalized KYC flow
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
5. **KYC Flow** - 5-step onboarding (Personal Info, Addiction Details, Quit Date, Motivation, Reminders)
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

## 🔮 Future Features

- Social features and community
- Gamification (badges, leaderboards)
- AI/ML features (personalized recommendations)
- Health integrations (Apple Health, Google Fit)
- Premium subscription tier

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
