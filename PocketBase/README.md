# QUIT HERO - Database Setup Guide

This guide will help new developers set up the complete PocketBase database for the Quit Hero application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (Recommended)](#quick-start-recommended)
- [What Gets Set Up](#what-gets-set-up)
- [Manual Setup (Advanced)](#manual-setup-advanced)
- [Database Schema Overview](#database-schema-overview)
- [Test Credentials](#test-credentials)
- [Troubleshooting](#troubleshooting)
- [Scripts Reference](#scripts-reference)

---

## Prerequisites

Before running the setup script, ensure you have:

1. **Docker** installed and running
   - [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Verify installation: `docker --version`

2. **Node.js** (v18 or higher)
   - [Download Node.js](https://nodejs.org/)
   - Verify installation: `node --version`

3. **Dependencies installed**
   ```bash
   npm install
   ```

---

## Quick Start (Recommended)

Follow these steps to set up the complete database:

### Step 1: Start PocketBase

```bash
npm run pb:start
```

This will:
- Start PocketBase in a Docker container
- Expose the API at `http://localhost:8096`
- Mount volumes for data persistence

Wait for the container to be healthy (about 5-10 seconds).

### Step 2: Create Admin Account

1. Open your browser and navigate to: **http://localhost:8096/_/**
2. You'll see the PocketBase admin setup page
3. Create your admin account with these credentials (or your own):
   - **Email**: `mainaksaha0807@gmail.com`
   - **Password**: `8104760831`

> **Note**: These credentials must match the values in your `.env` file at the project root.

### Step 3: Run Complete Setup Script

```bash
npm run pb:complete-setup
```

This single command will:
1. ✅ Authenticate with PocketBase
2. ✅ Create all 20+ collections with proper schemas
3. ✅ Set access control rules for frontend and backoffice
4. ✅ Seed the complete 10-day program (10 days × 3-4 steps each)
5. ✅ Create 17 achievements (bronze, silver, gold, platinum tiers)
6. ✅ Seed 10 motivational quotes and tips
7. ✅ Create 2 demo users for testing
8. ✅ Create 1 backoffice admin account
9. ✅ Verify the entire setup

### Step 4: Verify Setup

Check the terminal output. You should see:

```
✅ SETUP COMPLETE! ✅

📋 What was set up:
   ✓ 20+ collections with proper schemas
   ✓ Access control rules for frontend and backoffice
   ✓ Complete 10-day program with all steps
   ✓ 17 achievements across all tiers
   ✓ 10 motivational quotes and tips
   ✓ 2 demo users for testing
   ✓ 1 backoffice admin account
```

### Step 5: Start the Applications

```bash
# Start frontend (port 5175)
npm run dev

# Or start both frontend and backoffice
npm run dev:all
```

---

## What Gets Set Up

### Collections (20+ total)

#### User & Authentication
- `users` - PocketBase built-in user auth
- `admin_users` - Backoffice admin authentication
- `user_profiles` - Extended user data (age, gender, quit date, etc.)

#### Program & Content
- `programs` - Addiction recovery programs
- `program_days` - Individual days within programs
- `steps` - Individual learning steps (text, MCQ, exercises, videos)
- `content_items` - Articles, blogs, guides
- `quotes` - Motivational quotes and tips
- `media` - Media file library

#### User Progress & Engagement
- `user_sessions` - User enrollment in programs
- `session_progress` - Daily session completion status
- `step_responses` - User answers to questions
- `progress_stats` - Quit journey metrics (days free, money saved, etc.)
- `cravings` - Craving and slip logging
- `journal_entries` - Mood tracking and journaling

#### Gamification
- `achievements` - Available achievements
- `user_achievements` - User achievement unlock history

#### Admin & Support
- `support_tickets` - User support requests
- `notification_templates` - Email/push/SMS templates
- `analytics_events` - Event tracking
- `api_keys` - API key management
- `webhooks` - Webhook configuration
- `audit_logs` - Admin action logs

### Seed Data

#### 10-Day Program
- **Day 1**: Understanding Your Journey
- **Day 2**: Building Awareness
- **Day 3**: Developing Coping Strategies
- **Day 4**: Building Healthy Habits
- **Day 5**: Mid-Week Checkpoint
- **Day 6**: Managing Stress
- **Day 7**: One Week Milestone
- **Day 8**: Building Resilience
- **Day 9**: Planning for Long-Term Success
- **Day 10**: Graduation and Beyond

Each day includes 3-4 steps with a mix of:
- Text content
- Open-ended questions
- Multiple choice questions
- Exercises (breathing, mindfulness, etc.)

#### Achievements (17 total)

**Days Streak** (8 achievements)
- 🎯 First Step (1 day)
- 💪 3 Days Strong
- ⭐ Week Warrior (7 days)
- 🏆 Fortnight Fighter (14 days)
- 👑 Month Master (30 days)
- 💎 Quarter Champion (90 days)
- 🌟 Half Year Hero (180 days)
- 🎊 Annual Legend (365 days)

**Craving Resistance** (3 achievements)
- 🛡️ Craving Crusher (1 craving)
- ⚔️ Willpower Warrior (10 cravings)
- 🔥 Unstoppable Force (50 cravings)

**Session Completion** (3 achievements)
- 📚 Journey Begun (1 session)
- 📖 Dedicated Learner (5 sessions)
- 🎓 Program Graduate (10 sessions)

**Journal Entries** (3 achievements)
- ✍️ Self Reflection (1 entry)
- 📝 Mindful Writer (10 entries)
- 📔 Daily Chronicler (30 entries)

#### Quotes & Tips (10 total)
Motivational quotes from T.S. Eliot, Mark Twain, Theodore Roosevelt, and practical tips from the Quit Hero team.

---

## Test Credentials

After running the complete setup, you'll have access to these accounts:

### Frontend Demo Users

**Demo User**
- Email: `demo@quithero.com`
- Password: `Demo123456!`

**Test User**
- Email: `test@quithero.com`
- Password: `Test123456!`

### Backoffice Admin

**Admin**
- Email: `admin@backoffice.com`
- Password: `Admin123!`
- Role: admin

### PocketBase Super Admin

**Super Admin** (created in Step 2)
- Email: `mainaksaha0807@gmail.com` (or your custom email)
- Password: `8104760831` (or your custom password)

---

## Manual Setup (Advanced)

If you need to run individual setup steps:

### 1. Create Collections Only
```bash
npm run pb:setup
```

### 2. Set Access Rules
```bash
npm run pb:rules
```

### 3. Seed Program Content
```bash
npm run pb:seed-program
```

### 4. Seed Sample Data
```bash
npm run pb:seed-sample
```

---

## Database Schema Overview

### User Profile Schema
```javascript
{
  user: relation (users),
  age: number,
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say',
  language: 'en' | 'es' | 'fr' | 'hi' | 'de' | 'zh',
  quit_date: date,
  daily_reminder_time: text,
  nicotine_forms: json,
  how_long_using: number,
  daily_consumption: number,
  consumption_unit: 'cigarettes' | 'ml' | 'grams',
  motivations: json,
  enable_reminders: boolean
}
```

### Progress Stats Schema
```javascript
{
  user: relation (users),
  days_smoke_free: number,
  cigarettes_not_smoked: number,
  money_saved: number,
  life_regained_hours: number,
  health_improvement_percent: number,
  last_calculated: date
}
```

### Craving Schema
```javascript
{
  user: relation (users),
  type: 'craving' | 'slip',
  intensity: number (1-5),
  trigger: 'stress' | 'boredom' | 'social' | 'habit' | 'other',
  trigger_custom: text,
  notes: text
}
```

### Achievement Schema
```javascript
{
  key: text (unique),
  title: text,
  description: text,
  icon: text,
  tier: 'bronze' | 'silver' | 'gold' | 'platinum',
  requirement_type: 'days_streak' | 'cravings_resisted' | 'sessions_completed' | 'slips_under_threshold' | 'journal_entries',
  requirement_value: number,
  is_active: boolean,
  order: number
}
```

---

## Troubleshooting

### Issue: "Authentication failed"

**Solution:**
1. Make sure PocketBase is running: `npm run pb:start`
2. Verify admin account exists at http://localhost:8096/_/
3. Check credentials in `.env` file match your admin account
4. Wait 10 seconds after starting PocketBase before running setup

### Issue: "Connection refused" or "Cannot connect to PocketBase"

**Solution:**
1. Check if Docker is running: `docker ps`
2. Restart PocketBase: `npm run pb:restart`
3. Check PocketBase logs: `npm run pb:logs`
4. Ensure port 8096 is not used by another service

### Issue: "Collection already exists"

This is normal! The script will skip existing collections and only create missing ones.

### Issue: "Index creation failed"

This can be safely ignored. Indexes may fail if they already exist or if PocketBase handles them differently.

### Issue: Script hangs or times out

**Solution:**
1. Stop PocketBase: `npm run pb:stop`
2. Remove the data directory: `rm -rf PocketBase/pb_data`
3. Restart PocketBase: `npm run pb:start`
4. Wait 10 seconds
5. Create admin account again at http://localhost:8096/_/
6. Run setup again: `npm run pb:complete-setup`

### Issue: "Cannot find module 'pocketbase'"

**Solution:**
```bash
npm install
```

---

## Scripts Reference

### PocketBase Management

| Script | Description |
|--------|-------------|
| `npm run pb:start` | Start PocketBase Docker container |
| `npm run pb:stop` | Stop PocketBase Docker container |
| `npm run pb:restart` | Restart PocketBase |
| `npm run pb:logs` | View PocketBase logs |

### Database Setup

| Script | Description |
|--------|-------------|
| `npm run pb:complete-setup` | **Complete database setup (RECOMMENDED)** |
| `npm run pb:setup` | Create collections only |
| `npm run pb:rules` | Set access control rules |
| `npm run pb:seed-program` | Seed 10-day program |
| `npm run pb:seed-sample` | Seed sample data |

### Development

| Script | Description |
|--------|-------------|
| `npm run dev` | Start frontend (port 5175) |
| `npm run dev:backoffice` | Start backoffice (port 5176) |
| `npm run dev:all` | Start both frontend and backoffice |

---

## Access Points

After successful setup, you can access:

- **PocketBase Admin UI**: http://localhost:8096/_/
- **PocketBase API**: http://localhost:8096/api/
- **Frontend App**: http://localhost:5175 (after `npm run dev`)
- **Backoffice App**: http://localhost:5176 (after `npm run dev:backoffice`)

---

## Environment Variables

Make sure your `.env` file in the project root contains:

```bash
VITE_POCKETBASE_URL=http://localhost:8096
PB_ADMIN_EMAIL=mainaksaha0807@gmail.com
PB_ADMIN_PASSWORD=8104760831
```

For the backoffice, `backoffice/.env` should have:

```bash
VITE_POCKETBASE_URL=http://localhost:8096
```

---

## Next Steps

After completing the database setup:

1. **Test the Frontend**
   - Start the frontend: `npm run dev`
   - Navigate to http://localhost:5175
   - Login with demo user: `demo@quithero.com` / `Demo123456!`
   - Explore the 10-day program

2. **Test the Backoffice**
   - Start the backoffice: `npm run dev:backoffice`
   - Navigate to http://localhost:5176
   - Login with admin: `admin@backoffice.com` / `Admin123!`
   - Explore user management and analytics

3. **Customize Content**
   - Use the backoffice to add/edit program content
   - Create new achievements
   - Add more quotes and tips

4. **API Testing**
   - Use the PocketBase admin UI to test API endpoints
   - Explore the auto-generated API documentation

---

## Database Backup

To backup your PocketBase data:

```bash
# Copy the entire pb_data directory
cp -r PocketBase/pb_data PocketBase/pb_data_backup_$(date +%Y%m%d)
```

To restore from backup:

```bash
# Stop PocketBase
npm run pb:stop

# Restore data
rm -rf PocketBase/pb_data
cp -r PocketBase/pb_data_backup_YYYYMMDD PocketBase/pb_data

# Start PocketBase
npm run pb:start
```

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review PocketBase logs: `npm run pb:logs`
3. Check PocketBase documentation: https://pocketbase.io/docs/
4. Open an issue in the project repository

---

## Architecture Notes

### Access Control Rules

The setup script configures proper access rules:

- **User-owned collections**: Users can only CRUD their own records
- **Public-readable collections**: Anyone can read, only admins can write (programs, achievements, quotes)
- **Admin-only collections**: Only admin_users can access (api_keys, webhooks, audit_logs)

### Cascade Deletes

When a user is deleted, these collections automatically clean up:
- user_profiles
- user_sessions
- session_progress
- step_responses
- cravings
- journal_entries
- progress_stats
- user_achievements

### Indexes

Unique indexes are created on:
- `user_profiles.user` - One profile per user
- `progress_stats.user` - One stats record per user
- `achievements.key` - Unique achievement identifiers
- `api_keys.key` - Unique API keys

---

## Contributing

When adding new collections or modifying the schema:

1. Update `PocketBase/complete-setup.js`
2. Update this README with schema changes
3. Test the complete setup on a fresh database
4. Document any new environment variables needed

---

