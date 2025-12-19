# Program Collection Setup Guide

## Overview
This document describes the complete setup for the 10-day program system in Quit Hero, including database, frontend, and backoffice components.

## Database Structure

### Collections

#### 1. `programs` Collection
- **Purpose**: Stores program definitions
- **Fields**:
  - `title` (Text, required) - Program name
  - `description` (Text) - Program description
  - `is_active` (Boolean, default: true) - Whether program is active
  - `language` (Select, required) - Language code: en, es, fr, hi, de, zh
  - `duration_days` (Number, default: 10) - Program duration
  - `order` (Number) - Display order

#### 2. `program_days` Collection
- **Purpose**: Stores individual days within a program
- **Fields**:
  - `program` (Relation to programs, required)
  - `day_number` (Number, required, 1-10)
  - `title` (Text, required)
  - `subtitle` (Text)
  - `estimated_duration_min` (Number)
  - `is_locked` (Boolean, default: false)

#### 3. `steps` Collection
- **Purpose**: Stores steps/content for each program day
- **Fields**:
  - `program_day` (Relation to program_days, required)
  - `order` (Number, required)
  - `type` (Select, required): text, question_mcq, question_open, exercise, video, audio
  - `content_json` (JSON, required) - Step content based on type

## Setup Commands

### 1. Setup Database Collections
```bash
npm run pb:setup
```

### 2. Set API Rules
```bash
npm run pb:rules
```

### 3. Seed Full 10-Day Program
```bash
npm run pb:seed-program
```

This will create:
- 1 program (10-Day Quit Hero Program)
- 10 program days (Day 1 through Day 10)
- 31 steps total across all days

## Frontend Integration

### Program Service
Located in: `frontend/services/program.service.ts`

**Key Methods**:
- `getActiveProgram(language)` - Get active program for a language
- `getProgramDays(programId)` - Get all days for a program
- `getSteps(programDayId)` - Get all steps for a day
- `getProgramDayById(programDayId)` - Get a specific day
- `getProgramDayByNumber(programId, dayNumber)` - Get day by number

### Session Creation
When a user completes onboarding (in `ReminderSettings.tsx`):
1. Fetches active program using `programService.getActiveProgram('en')`
2. Creates user session using `sessionService.createOrGetSession(userId, programId)`
3. User can then access the program through the Sessions page

## Backoffice Management

### Programs Page
Location: `backoffice/src/pages/content/Programs.tsx`

**Features**:
- View all programs (table/card view)
- Create new programs
- Edit existing programs
- Toggle active/inactive status
- Delete programs (with enrollment check)
- Duplicate programs
- Filter by language and status
- View enrollment and completion stats

### Program Days Page
Location: `backoffice/src/pages/content/ProgramDays.tsx`

**Features**:
- View all days for a program
- Add new days
- Edit days
- Delete days
- Toggle lock status
- Duplicate days
- Navigate to manage steps for each day

### Steps Page
Location: `backoffice/src/pages/content/Steps.tsx`

**Features**:
- View all steps for a day
- Add new steps
- Edit steps
- Delete steps
- Duplicate steps
- Support for all step types:
  - Text content
  - Multiple choice questions
  - Open questions
  - Exercises
  - Video
  - Audio

## Program Content Structure

### Day 1: Understanding Your Journey
- Welcome message
- Open question about motivation
- Encouragement text

### Day 2: Building Awareness
- Trigger awareness content
- Multiple choice question
- Breathing exercise

### Day 3: Developing Coping Strategies
- Coping strategies introduction
- Open question about calming activities
- 5-5-5 technique exercise

### Day 4: Building Healthy Habits
- Habit replacement content
- Open question about new habits
- Encouragement text

### Day 5: Mid-Week Checkpoint
- Progress celebration
- Reflection question
- Motivation text

### Day 6: Managing Stress
- Stress management content
- Progressive muscle relaxation exercise
- Open question about stress relief

### Day 7: One Week Milestone
- Milestone celebration
- Health improvements information
- Reflection question

### Day 8: Building Resilience
- Resilience building content
- Multiple choice question
- Encouragement text

### Day 9: Planning for Long-Term Success
- Long-term planning content
- Goal-setting question
- Motivation text

### Day 10: Graduation and Beyond
- Completion celebration
- Future guidance
- Final reflection question
- Closing encouragement

## API Rules

All program-related collections have public read access (for frontend users):
- `programs`: Public list/view, Admin create/update/delete
- `program_days`: Public list/view, Admin create/update/delete
- `steps`: Public list/view, Admin create/update/delete

## Testing

1. **Verify Program Seeding**:
   ```bash
   npm run pb:seed-program
   ```
   Check console output for success messages

2. **Test Frontend**:
   - Complete onboarding flow
   - Verify session is created
   - Check Sessions page shows 10 days
   - Test accessing a session day

3. **Test Backoffice**:
   - Login to backoffice
   - Navigate to Content > Programs
   - Verify program is listed
   - Test creating/editing programs
   - Test managing days and steps

## Troubleshooting

### Program Not Found
- Run `npm run pb:seed-program` to create the program
- Check that `is_active = true` and `language = 'en'`

### Days Not Showing
- Verify program_days are created for the program
- Check API rules are set correctly
- Verify frontend is using correct program ID

### Steps Not Loading
- Check steps are created for each day
- Verify `content_json` is valid JSON
- Check step `order` field is set correctly
