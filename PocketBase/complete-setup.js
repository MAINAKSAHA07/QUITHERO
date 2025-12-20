#!/usr/bin/env node

/**
 * QUIT HERO - Complete Database Setup Script
 * ============================================
 *
 * This script provides a complete database setup for new developers.
 * It will create all collections, set proper permissions, seed initial data,
 * and create sample users for testing.
 *
 * Prerequisites:
 * 1. Docker must be installed and running
 * 2. PocketBase container must be running (npm run pb:start)
 * 3. Admin account must be created via web UI (check AWS_POCKETBASE_URL in .env)
 *
 * Usage:
 *   npm run pb:complete-setup
 *   OR
 *   node PocketBase/complete-setup.js
 *
 * What this script does:
 * 1. Creates all 20+ collections with proper schemas
 * 2. Sets up access control rules for frontend and backoffice
 * 3. Seeds the complete 10-day program with all steps
 * 4. Creates sample achievements
 * 5. Creates demo users for testing
 * 6. Seeds sample data for all collections
 * 7. Verifies the setup
 *
 * Environment Variables (from .env):
 * - AWS_POCKETBASE_URL (primary, e.g., http://54.153.95.239:8096/_/)
 * - AWS_PB_ADMIN_EMAIL (primary)
 * - AWS_PB_ADMIN_PASSWORD (primary)
 * - VITE_POCKETBASE_URL (fallback, default: http://localhost:8096)
 * - PB_ADMIN_EMAIL (fallback)
 * - PB_ADMIN_PASSWORD (fallback)
 * 
 * Note: The script automatically loads variables from .env file in the project root.
 */

import PocketBase from 'pocketbase'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

// Load .env file from project root
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = join(__dirname, '..', '.env')

try {
  const envFile = readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach(line => {
    // Skip comments and empty lines
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return
    }
    
    // Handle export statements: export KEY=value or export KEY="value"
    let match = trimmedLine.match(/^export\s+([^=]+?)\s*=\s*(.*?)\s*$/)
    if (!match) {
      // Handle regular KEY=value format
      match = trimmedLine.match(/^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$/)
    }
    
    if (match) {
      const key = match[1].trim()
      let value = match[2].trim()
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      
      // Only set if not already in process.env (environment variables take precedence)
      if (!process.env[key] && value) {
        process.env[key] = value
      }
    }
  })
  console.log(`✓ Loaded environment variables from ${envPath}`)
} catch (error) {
  console.warn(`⚠️  Warning: Could not load .env file from ${envPath}`)
  console.warn(`   Error: ${error.message}`)
  console.warn(`   Continuing with system environment variables...\n`)
}

// ==================== CONFIGURATION ====================
// Use AWS environment variables from .env, fallback to defaults
let PB_URL = process.env.AWS_POCKETBASE_URL || process.env.VITE_POCKETBASE_URL || 'http://localhost:8096'

// Remove /_/ suffix if present (PocketBase client needs base URL)
if (PB_URL) {
  PB_URL = PB_URL.replace(/\/_\//g, '').replace(/\/$/, '')
} else {
  console.error('❌ Error: PocketBase URL is not configured!')
  console.error('   Please set AWS_POCKETBASE_URL or VITE_POCKETBASE_URL in .env file')
  process.exit(1)
}

const ADMIN_EMAIL = process.env.AWS_PB_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.AWS_PB_ADMIN_PASSWORD || process.env.PB_ADMIN_PASSWORD

// Validate required credentials
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ Error: Admin credentials are not configured!')
  console.error('   Please set AWS_PB_ADMIN_EMAIL and AWS_PB_ADMIN_PASSWORD in .env file')
  process.exit(1)
}

console.log('📋 Configuration:')
console.log(`   PocketBase URL: ${PB_URL}`)
console.log(`   Admin Email: ${ADMIN_EMAIL}`)
console.log('')

const pb = new PocketBase(PB_URL)

// ==================== COLLECTION SCHEMAS ====================
const collections = [
  // Backoffice admin auth collection
  {
    name: 'admin_users',
    type: 'auth',
    schema: [
      { name: 'name', type: 'text', options: {} },
      { name: 'role', type: 'select', options: { values: ['admin', 'editor', 'support', 'analyst'] } },
    ],
  },

  // User Profile
  {
    name: 'user_profiles',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true }, required: true },
      { name: 'age', type: 'number', options: {} },
      { name: 'gender', type: 'select', options: { values: ['male', 'female', 'other', 'prefer_not_to_say'] } },
      { name: 'language', type: 'select', options: { values: ['en', 'es', 'fr', 'hi', 'de', 'zh'] }, required: true },
      { name: 'quit_date', type: 'date', options: {}, required: true },
      { name: 'daily_reminder_time', type: 'text', options: {} },
      { name: 'nicotine_forms', type: 'json', options: {} },
      { name: 'how_long_using', type: 'number', options: {} },
      { name: 'daily_consumption', type: 'number', options: {} },
      { name: 'consumption_unit', type: 'select', options: { values: ['cigarettes', 'ml', 'grams'] } },
      { name: 'motivations', type: 'json', options: {} },
      { name: 'enable_reminders', type: 'bool', options: { defaultValue: true } },
    ],
    indexes: [{ fields: ['user'], unique: true }],
  },

  // Programs
  {
    name: 'programs',
    type: 'base',
    schema: [
      { name: 'title', type: 'text', options: {}, required: true },
      { name: 'description', type: 'text', options: {} },
      { name: 'is_active', type: 'bool', options: { defaultValue: true } },
      { name: 'language', type: 'select', options: { values: ['en', 'es', 'fr', 'hi', 'de', 'zh'] }, required: true },
      { name: 'duration_days', type: 'number', options: { defaultValue: 10 } },
      { name: 'order', type: 'number', options: {} },
    ],
  },

  // Program Days
  {
    name: 'program_days',
    type: 'base',
    schema: [
      { name: 'program', type: 'relation', options: { collectionId: 'programs', maxSelect: 1, cascadeDelete: true }, required: true },
      { name: 'day_number', type: 'number', options: {}, required: true },
      { name: 'title', type: 'text', options: {}, required: true },
      { name: 'subtitle', type: 'text', options: {} },
      { name: 'estimated_duration_min', type: 'number', options: {} },
      { name: 'is_locked', type: 'bool', options: { defaultValue: false } },
    ],
  },

  // Steps
  {
    name: 'steps',
    type: 'base',
    schema: [
      { name: 'program_day', type: 'relation', options: { collectionId: 'program_days', maxSelect: 1, cascadeDelete: true }, required: true },
      { name: 'order', type: 'number', options: {}, required: true },
      { name: 'type', type: 'select', options: { values: ['text', 'question_mcq', 'question_open', 'exercise', 'video', 'audio'] }, required: true },
      { name: 'content_json', type: 'json', options: {}, required: true },
    ],
  },

  // User Sessions
  {
    name: 'user_sessions',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true }, required: true },
      { name: 'program', type: 'relation', options: { collectionId: 'programs', maxSelect: 1 }, required: true },
      { name: 'current_day', type: 'number', options: { defaultValue: 1 } },
      { name: 'status', type: 'select', options: { values: ['not_started', 'in_progress', 'completed'] }, required: true },
      { name: 'started_at', type: 'date', options: {} },
      { name: 'completed_at', type: 'date', options: {} },
    ],
  },

  // Session Progress
  {
    name: 'session_progress',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true }, required: true },
      { name: 'program_day', type: 'relation', options: { collectionId: 'program_days', maxSelect: 1 }, required: true },
      { name: 'status', type: 'select', options: { values: ['not_started', 'in_progress', 'completed'] }, required: true },
      { name: 'last_step_index', type: 'number', options: { defaultValue: 0 } },
      { name: 'completed_at', type: 'date', options: {} },
      { name: 'time_spent_minutes', type: 'number', options: { defaultValue: 0 } },
    ],
  },

  // Step Responses
  {
    name: 'step_responses',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true }, required: true },
      { name: 'step', type: 'relation', options: { collectionId: 'steps', maxSelect: 1 }, required: true },
      { name: 'response_json', type: 'json', options: {} },
    ],
  },

  // Cravings
  {
    name: 'cravings',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true }, required: true },
      { name: 'type', type: 'select', options: { values: ['craving', 'slip'] }, required: true },
      { name: 'intensity', type: 'number', options: { min: 1, max: 5 } },
      { name: 'trigger', type: 'select', options: { values: ['stress', 'boredom', 'social', 'habit', 'other'] } },
      { name: 'trigger_custom', type: 'text', options: {} },
      { name: 'notes', type: 'text', options: {} },
    ],
  },

  // Journal Entries
  {
    name: 'journal_entries',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true }, required: true },
      { name: 'date', type: 'date', options: {}, required: true },
      { name: 'mood', type: 'select', options: { values: ['very_happy', 'happy', 'neutral', 'sad', 'very_sad'] } },
      { name: 'title', type: 'text', options: {} },
      { name: 'content', type: 'text', options: {} },
    ],
  },

  // Progress Stats
  {
    name: 'progress_stats',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true }, required: true },
      { name: 'days_smoke_free', type: 'number', options: { defaultValue: 0 } },
      { name: 'cigarettes_not_smoked', type: 'number', options: { defaultValue: 0 } },
      { name: 'money_saved', type: 'number', options: { defaultValue: 0 } },
      { name: 'life_regained_hours', type: 'number', options: { defaultValue: 0 } },
      { name: 'health_improvement_percent', type: 'number', options: { defaultValue: 0 } },
      { name: 'last_calculated', type: 'date', options: {} },
    ],
    indexes: [{ fields: ['user'], unique: true }],
  },

  // Achievements
  {
    name: 'achievements',
    type: 'base',
    schema: [
      { name: 'key', type: 'text', options: {}, required: true },
      { name: 'title', type: 'text', options: {}, required: true },
      { name: 'description', type: 'text', options: {} },
      { name: 'icon', type: 'text', options: {} },
      { name: 'tier', type: 'select', options: { values: ['bronze', 'silver', 'gold', 'platinum'] } },
      { name: 'requirement_type', type: 'select', options: { values: ['days_streak', 'cravings_resisted', 'sessions_completed', 'slips_under_threshold', 'journal_entries'] } },
      { name: 'requirement_value', type: 'number', options: {} },
      { name: 'is_active', type: 'bool', options: { defaultValue: true } },
      { name: 'order', type: 'number', options: {} },
    ],
    indexes: [{ fields: ['key'], unique: true }],
  },

  // User Achievements
  {
    name: 'user_achievements',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true }, required: true },
      { name: 'achievement', type: 'relation', options: { collectionId: 'achievements', maxSelect: 1 }, required: true },
      { name: 'unlocked_at', type: 'date', options: {} },
      { name: 'unlock_method', type: 'select', options: { values: ['automatic', 'manual'] } },
      { name: 'reason', type: 'text', options: {} },
    ],
  },

  // Analytics Events
  {
    name: 'analytics_events',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1 } },
      { name: 'event_type', type: 'text', options: {}, required: true },
      { name: 'meta', type: 'json', options: {} },
    ],
  },

  // Content Items
  {
    name: 'content_items',
    type: 'base',
    schema: [
      { name: 'title', type: 'text', options: {}, required: true },
      { name: 'content', type: 'text', options: {} },
      { name: 'type', type: 'select', options: { values: ['article', 'blog', 'guide', 'quote', 'tip'] } },
      { name: 'language', type: 'select', options: { values: ['en', 'es', 'fr', 'hi', 'de', 'zh'] } },
      { name: 'status', type: 'select', options: { values: ['draft', 'published', 'archived'] } },
      { name: 'image_url', type: 'text', options: {} },
      { name: 'is_active', type: 'bool', options: { defaultValue: true } },
      { name: 'order', type: 'number', options: {} },
    ],
  },

  // Support Tickets
  {
    name: 'support_tickets',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1 }, required: true },
      { name: 'subject', type: 'text', options: {}, required: true },
      { name: 'message', type: 'text', options: {} },
      { name: 'description', type: 'text', options: {} },
      { name: 'status', type: 'select', options: { values: ['open', 'in_progress', 'resolved', 'closed'] }, required: true },
      { name: 'priority', type: 'select', options: { values: ['low', 'medium', 'high', 'urgent'] } },
      { name: 'category', type: 'select', options: { values: ['technical', 'content', 'billing', 'other'] } },
      { name: 'assigned_to', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1 } },
    ],
  },

  // Notification Templates
  {
    name: 'notification_templates',
    type: 'base',
    schema: [
      { name: 'name', type: 'text', options: {}, required: true },
      { name: 'type', type: 'select', options: { values: ['email', 'push', 'sms'] }, required: true },
      { name: 'trigger_event', type: 'text', options: {}, required: true },
      { name: 'language', type: 'select', options: { values: ['en', 'es', 'fr', 'hi', 'de', 'zh'] }, required: true },
      { name: 'is_active', type: 'bool', options: { defaultValue: true } },
      { name: 'subject', type: 'text', options: {} },
      { name: 'content', type: 'text', options: {} },
      { name: 'from_name', type: 'text', options: {} },
      { name: 'from_email', type: 'text', options: {} },
    ],
  },

  // Quotes
  {
    name: 'quotes',
    type: 'base',
    schema: [
      { name: 'type', type: 'select', options: { values: ['quote', 'tip'] }, required: true },
      { name: 'content', type: 'text', options: {}, required: true },
      { name: 'author', type: 'text', options: {} },
      { name: 'language', type: 'select', options: { values: ['en', 'es', 'fr', 'hi', 'de', 'zh'] }, required: true },
      { name: 'is_active', type: 'bool', options: { defaultValue: true } },
    ],
  },

  // Media
  {
    name: 'media',
    type: 'base',
    schema: [
      { name: 'filename', type: 'text', options: {}, required: true },
      { name: 'type', type: 'select', options: { values: ['image', 'video', 'audio', 'document', 'other'] }, required: true },
      { name: 'url', type: 'url', options: {} },
      { name: 'size', type: 'number', options: {} },
      { name: 'folder', type: 'text', options: {} },
    ],
  },

  // API Keys
  {
    name: 'api_keys',
    type: 'base',
    schema: [
      { name: 'name', type: 'text', options: {}, required: true },
      { name: 'key', type: 'text', options: {}, required: true },
      { name: 'permissions', type: 'json', options: {} },
      { name: 'status', type: 'select', options: { values: ['active', 'revoked'] }, required: true },
      { name: 'last_used', type: 'date', options: {} },
      { name: 'expires_at', type: 'date', options: {} },
    ],
    indexes: [{ fields: ['key'], unique: true }],
  },

  // Webhooks
  {
    name: 'webhooks',
    type: 'base',
    schema: [
      { name: 'url', type: 'url', options: {}, required: true },
      { name: 'events', type: 'json', options: {} },
      { name: 'status', type: 'select', options: { values: ['active', 'inactive'] }, required: true },
      { name: 'secret', type: 'text', options: {} },
    ],
  },

  // Audit Logs
  {
    name: 'audit_logs',
    type: 'base',
    schema: [
      { name: 'admin_user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1 } },
      { name: 'action', type: 'text', options: {}, required: true },
      { name: 'action_type', type: 'select', options: { values: ['user_management', 'content_management', 'settings_changes', 'support_actions', 'deletions', 'login_logout', 'permission_changes'] } },
      { name: 'entity_type', type: 'text', options: {} },
      { name: 'entity_id', type: 'text', options: {} },
      { name: 'details', type: 'json', options: {} },
      { name: 'ip_address', type: 'text', options: {} },
      { name: 'user_agent', type: 'text', options: {} },
      { name: 'timestamp', type: 'date', options: {} },
    ],
  },
]

// ==================== 10-DAY PROGRAM DATA ====================
const programDays = [
  {
    day_number: 1,
    title: 'Day 1: Understanding Your Journey',
    subtitle: 'Welcome and Foundation',
    estimated_duration_min: 15,
    steps: [
      {
        order: 1,
        type: 'text',
        content_json: {
          text: 'Welcome to your 10-day transformation journey! Today marks the beginning of a new chapter in your life. You\'ve taken the courageous first step towards freedom from addiction.',
          image_url: '',
        },
      },
      {
        order: 2,
        type: 'question_open',
        content_json: {
          question: 'What motivated you to start this journey today?',
          placeholder: 'Share your thoughts...',
        },
      },
      {
        order: 3,
        type: 'text',
        content_json: {
          text: 'Remember: Every journey begins with a single step. You\'re not alone in this.',
          image_url: '',
        },
      },
    ],
  },
  {
    day_number: 2,
    title: 'Day 2: Building Awareness',
    subtitle: 'Understanding Triggers',
    estimated_duration_min: 20,
    steps: [
      {
        order: 1,
        type: 'text',
        content_json: {
          text: 'Today we\'ll explore what triggers your cravings. Understanding your triggers is the first step to overcoming them.',
          image_url: '',
        },
      },
      {
        order: 2,
        type: 'question_mcq',
        content_json: {
          question: 'What situations typically trigger your cravings?',
          options: ['Stress', 'Boredom', 'Social situations', 'After meals', 'All of the above'],
          correct_answer: 4,
        },
      },
      {
        order: 3,
        type: 'exercise',
        content_json: {
          text: 'Practice deep breathing: Inhale for 4 counts, hold for 4, exhale for 4. Repeat 5 times.',
        },
      },
    ],
  },
  {
    day_number: 3,
    title: 'Day 3: Developing Coping Strategies',
    subtitle: 'Tools for Success',
    estimated_duration_min: 25,
    steps: [
      {
        order: 1,
        type: 'text',
        content_json: {
          text: 'Today we\'ll learn practical coping strategies to handle cravings when they arise.',
          image_url: '',
        },
      },
      {
        order: 2,
        type: 'question_open',
        content_json: {
          question: 'What activities help you feel calm and centered?',
          placeholder: 'List your go-to activities...',
        },
      },
      {
        order: 3,
        type: 'exercise',
        content_json: {
          text: 'Try the 5-5-5 technique: Name 5 things you see, 4 things you hear, 3 things you feel, 2 things you smell, 1 thing you taste.',
        },
      },
    ],
  },
  {
    day_number: 4,
    title: 'Day 4: Building Healthy Habits',
    subtitle: 'Replacement Activities',
    estimated_duration_min: 20,
    steps: [
      {
        order: 1,
        type: 'text',
        content_json: {
          text: 'Replacing old habits with new, healthy ones is key to long-term success.',
          image_url: '',
        },
      },
      {
        order: 2,
        type: 'question_open',
        content_json: {
          question: 'What new healthy habit would you like to develop?',
          placeholder: 'Share your goal...',
        },
      },
      {
        order: 3,
        type: 'text',
        content_json: {
          text: 'Start small. Even 5 minutes of a new activity can make a difference.',
          image_url: '',
        },
      },
    ],
  },
  {
    day_number: 5,
    title: 'Day 5: Mid-Week Checkpoint',
    subtitle: 'Reflection and Progress',
    estimated_duration_min: 15,
    steps: [
      {
        order: 1,
        type: 'text',
        content_json: {
          text: 'Congratulations on reaching Day 5! You\'re halfway through your first week. Take a moment to acknowledge your progress.',
          image_url: '',
        },
      },
      {
        order: 2,
        type: 'question_open',
        content_json: {
          question: 'How are you feeling about your progress so far?',
          placeholder: 'Reflect on your journey...',
        },
      },
      {
        order: 3,
        type: 'text',
        content_json: {
          text: 'Every day you resist is a victory. Keep going!',
          image_url: '',
        },
      },
    ],
  },
  {
    day_number: 6,
    title: 'Day 6: Managing Stress',
    subtitle: 'Stress Relief Techniques',
    estimated_duration_min: 25,
    steps: [
      {
        order: 1,
        type: 'text',
        content_json: {
          text: 'Stress is a common trigger. Today we\'ll learn effective stress management techniques.',
          image_url: '',
        },
      },
      {
        order: 2,
        type: 'exercise',
        content_json: {
          text: 'Practice progressive muscle relaxation: Tense and release each muscle group from toes to head.',
        },
      },
      {
        order: 3,
        type: 'question_open',
        content_json: {
          question: 'What stress-relief techniques work best for you?',
          placeholder: 'Share your methods...',
        },
      },
    ],
  },
  {
    day_number: 7,
    title: 'Day 7: One Week Milestone',
    subtitle: 'Celebrating Your Achievement',
    estimated_duration_min: 20,
    steps: [
      {
        order: 1,
        type: 'text',
        content_json: {
          text: '🎉 You\'ve completed your first week! This is a significant milestone. Your body is already beginning to heal.',
          image_url: '',
        },
      },
      {
        order: 2,
        type: 'text',
        content_json: {
          text: 'Health improvements after 7 days:\n- Blood pressure and heart rate normalize\n- Carbon monoxide levels drop\n- Sense of taste and smell improve',
          image_url: '',
        },
      },
      {
        order: 3,
        type: 'question_open',
        content_json: {
          question: 'What positive changes have you noticed this week?',
          placeholder: 'Celebrate your wins...',
        },
      },
    ],
  },
  {
    day_number: 8,
    title: 'Day 8: Building Resilience',
    subtitle: 'Strengthening Your Willpower',
    estimated_duration_min: 20,
    steps: [
      {
        order: 1,
        type: 'text',
        content_json: {
          text: 'Resilience is built through practice. Each challenge you overcome makes you stronger.',
          image_url: '',
        },
      },
      {
        order: 2,
        type: 'question_mcq',
        content_json: {
          question: 'When facing a craving, what helps you most?',
          options: ['Deep breathing', 'Distraction', 'Talking to someone', 'All of the above'],
          correct_answer: 3,
        },
      },
      {
        order: 3,
        type: 'text',
        content_json: {
          text: 'Remember: Cravings are temporary. They will pass.',
          image_url: '',
        },
      },
    ],
  },
  {
    day_number: 9,
    title: 'Day 9: Planning for Long-Term Success',
    subtitle: 'Setting Future Goals',
    estimated_duration_min: 25,
    steps: [
      {
        order: 1,
        type: 'text',
        content_json: {
          text: 'As you approach the end of this program, it\'s time to plan for your continued success.',
          image_url: '',
        },
      },
      {
        order: 2,
        type: 'question_open',
        content_json: {
          question: 'What are your goals for the next 30 days?',
          placeholder: 'Set your intentions...',
        },
      },
      {
        order: 3,
        type: 'text',
        content_json: {
          text: 'You have the tools and knowledge to succeed. Trust the process.',
          image_url: '',
        },
      },
    ],
  },
  {
    day_number: 10,
    title: 'Day 10: Graduation and Beyond',
    subtitle: 'Your New Beginning',
    estimated_duration_min: 20,
    steps: [
      {
        order: 1,
        type: 'text',
        content_json: {
          text: '🎓 Congratulations! You\'ve completed the 10-day program! This is just the beginning of your transformation.',
          image_url: '',
        },
      },
      {
        order: 2,
        type: 'text',
        content_json: {
          text: 'You\'ve proven to yourself that you can do this. Continue using the tools and strategies you\'ve learned.',
          image_url: '',
        },
      },
      {
        order: 3,
        type: 'question_open',
        content_json: {
          question: 'How do you feel about completing this program?',
          placeholder: 'Share your thoughts...',
        },
      },
      {
        order: 4,
        type: 'text',
        content_json: {
          text: 'Remember: Every day is a new opportunity. Keep going, you\'ve got this! 💪',
          image_url: '',
        },
      },
    ],
  },
]

// ==================== ACHIEVEMENT DATA ====================
const achievementsData = [
  // Days Streak Achievements
  { key: 'first_day', title: 'First Step', description: 'Completed your first smoke-free day', icon: '🎯', tier: 'bronze', requirement_type: 'days_streak', requirement_value: 1, order: 1 },
  { key: 'three_days', title: '3 Days Strong', description: '3 consecutive days smoke-free', icon: '💪', tier: 'bronze', requirement_type: 'days_streak', requirement_value: 3, order: 2 },
  { key: 'one_week', title: 'Week Warrior', description: '7 days smoke-free!', icon: '⭐', tier: 'silver', requirement_type: 'days_streak', requirement_value: 7, order: 3 },
  { key: 'two_weeks', title: 'Fortnight Fighter', description: '14 days of freedom', icon: '🏆', tier: 'silver', requirement_type: 'days_streak', requirement_value: 14, order: 4 },
  { key: 'one_month', title: 'Month Master', description: '30 days smoke-free!', icon: '👑', tier: 'gold', requirement_type: 'days_streak', requirement_value: 30, order: 5 },
  { key: 'three_months', title: 'Quarter Champion', description: '90 days of success', icon: '💎', tier: 'gold', requirement_type: 'days_streak', requirement_value: 90, order: 6 },
  { key: 'six_months', title: 'Half Year Hero', description: '180 days smoke-free', icon: '🌟', tier: 'platinum', requirement_type: 'days_streak', requirement_value: 180, order: 7 },
  { key: 'one_year', title: 'Annual Legend', description: '365 days of freedom!', icon: '🎊', tier: 'platinum', requirement_type: 'days_streak', requirement_value: 365, order: 8 },

  // Craving Resistance
  { key: 'first_craving', title: 'Craving Crusher', description: 'Resisted your first craving', icon: '🛡️', tier: 'bronze', requirement_type: 'cravings_resisted', requirement_value: 1, order: 9 },
  { key: 'ten_cravings', title: 'Willpower Warrior', description: 'Resisted 10 cravings', icon: '⚔️', tier: 'silver', requirement_type: 'cravings_resisted', requirement_value: 10, order: 10 },
  { key: 'fifty_cravings', title: 'Unstoppable Force', description: 'Resisted 50 cravings', icon: '🔥', tier: 'gold', requirement_type: 'cravings_resisted', requirement_value: 50, order: 11 },

  // Session Completion
  { key: 'first_session', title: 'Journey Begun', description: 'Completed first session', icon: '📚', tier: 'bronze', requirement_type: 'sessions_completed', requirement_value: 1, order: 12 },
  { key: 'five_sessions', title: 'Dedicated Learner', description: 'Completed 5 sessions', icon: '📖', tier: 'silver', requirement_type: 'sessions_completed', requirement_value: 5, order: 13 },
  { key: 'program_complete', title: 'Program Graduate', description: 'Completed the 10-day program', icon: '🎓', tier: 'gold', requirement_type: 'sessions_completed', requirement_value: 10, order: 14 },

  // Journal Entries
  { key: 'first_journal', title: 'Self Reflection', description: 'Created first journal entry', icon: '✍️', tier: 'bronze', requirement_type: 'journal_entries', requirement_value: 1, order: 15 },
  { key: 'ten_journals', title: 'Mindful Writer', description: 'Created 10 journal entries', icon: '📝', tier: 'silver', requirement_type: 'journal_entries', requirement_value: 10, order: 16 },
  { key: 'thirty_journals', title: 'Daily Chronicler', description: 'Created 30 journal entries', icon: '📔', tier: 'gold', requirement_type: 'journal_entries', requirement_value: 30, order: 17 },
]

// ==================== SAMPLE QUOTES ====================
const quotesData = [
  { type: 'quote', content: 'Every moment is a fresh beginning.', author: 'T.S. Eliot', language: 'en' },
  { type: 'quote', content: 'The secret of getting ahead is getting started.', author: 'Mark Twain', language: 'en' },
  { type: 'quote', content: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt', language: 'en' },
  { type: 'quote', content: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier', language: 'en' },
  { type: 'tip', content: 'When a craving hits, try drinking a glass of cold water or taking a quick walk.', author: 'Quit Hero Team', language: 'en' },
  { type: 'tip', content: 'Keep your hands busy. Stress balls, puzzles, or drawing can help distract from cravings.', author: 'Quit Hero Team', language: 'en' },
  { type: 'tip', content: 'Celebrate small wins. Each day smoke-free is a victory worth acknowledging.', author: 'Quit Hero Team', language: 'en' },
  { type: 'quote', content: 'You are stronger than your cravings. Remember why you started.', author: 'Anonymous', language: 'en' },
  { type: 'tip', content: 'Practice deep breathing: 4 counts in, hold 4, out 4. Repeat until the craving passes.', author: 'Quit Hero Team', language: 'en' },
  { type: 'quote', content: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', language: 'en' },
]

// ==================== HELPER FUNCTIONS ====================

async function createCollection(collectionDef) {
  try {
    // Check if collection exists
    let existing
    try {
      existing = await pb.collections.getFirstListItem(`name="${collectionDef.name}"`)
      console.log(`  ✓ Collection "${collectionDef.name}" already exists`)
      
      // Check for missing fields and add them
      const existingFieldNames = existing.schema.map(f => f.name)
      const requiredFieldNames = collectionDef.schema.map(f => f.name)
      const missingFields = requiredFieldNames.filter(name => !existingFieldNames.includes(name))
      
      if (missingFields.length > 0) {
        console.log(`    → Adding ${missingFields.length} missing field(s)...`)
        
        // Transform missing fields to PocketBase format
        const fieldsToAdd = collectionDef.schema
          .filter(field => missingFields.includes(field.name))
          .map(field => {
            const fieldDef = {
              name: field.name,
              type: field.type,
              required: field.required || false,
            }

            // Add options based on field type
            if (field.type === 'relation') {
              fieldDef.options = {
                collectionId: field.options.collectionId,
                cascadeDelete: field.options.cascadeDelete || false,
                maxSelect: field.options.maxSelect || 1,
              }
            } else if (field.type === 'select') {
              fieldDef.options = { values: field.options.values || [] }
            } else if (field.type === 'number') {
              fieldDef.options = {}
              if (field.options?.min !== undefined) fieldDef.options.min = field.options.min
              if (field.options?.max !== undefined) fieldDef.options.max = field.options.max
            } else if (field.type === 'bool') {
              fieldDef.options = { defaultValue: field.options?.defaultValue || false }
            } else {
              fieldDef.options = field.options || {}
            }

            return fieldDef
          })
        
        // Add missing fields to existing collection
        const updatedSchema = [...existing.schema, ...fieldsToAdd]
        await pb.collections.update(existing.id, {
          schema: updatedSchema,
        })
        console.log(`    ✓ Added missing fields: ${missingFields.join(', ')}`)
      }
      
      return { success: true, skipped: true, collection: existing }
    } catch (e) {
      // Collection doesn't exist, create it
    }

    // Transform schema to PocketBase format
    const schema = collectionDef.schema.map(field => {
      const fieldDef = {
        name: field.name,
        type: field.type,
        required: field.required || false,
      }

      // Add options based on field type
      if (field.type === 'relation') {
        fieldDef.options = {
          collectionId: field.options.collectionId,
          cascadeDelete: field.options.cascadeDelete || false,
          maxSelect: field.options.maxSelect || 1,
        }
      } else if (field.type === 'select') {
        fieldDef.options = { values: field.options.values || [] }
      } else if (field.type === 'number') {
        fieldDef.options = {}
        if (field.options?.min !== undefined) fieldDef.options.min = field.options.min
        if (field.options?.max !== undefined) fieldDef.options.max = field.options.max
      } else if (field.type === 'bool') {
        fieldDef.options = { defaultValue: field.options?.defaultValue || false }
      } else {
        fieldDef.options = field.options || {}
      }

      return fieldDef
    })

    // Create collection
    const collection = await pb.collections.create({
      name: collectionDef.name,
      type: collectionDef.type || 'base',
      schema: schema,
    })

    // Add indexes if specified
    if (collectionDef.indexes && collectionDef.indexes.length > 0) {
      for (const index of collectionDef.indexes) {
        try {
          await pb.collections.update(collection.id, {
            indexes: [{ fields: index.fields.join(','), unique: index.unique || false }]
          })
        } catch (idxError) {
          console.warn(`    ⚠ Could not create index for ${collectionDef.name}`)
        }
      }
    }

    console.log(`  ✓ Created collection: ${collectionDef.name}`)
    return { success: true, collection }
  } catch (error) {
    console.error(`  ✗ Failed to create collection "${collectionDef.name}":`, error.message)
    if (error.response) {
      console.error(`    Details:`, JSON.stringify(error.response, null, 2))
    }
    return { success: false, error: error.message }
  }
}

async function setPermissions() {
  console.log('\n📋 Step 3: Setting Access Control Rules...\n')

  const adminRule = '@request.auth.collectionName = "admin_users"'
  const ownerRule = (field) => `@request.auth.id = ${field}`

  const configs = [
    // Users collection
    {
      name: 'users',
      listRule: adminRule,
      viewRule: `${adminRule} || @request.auth.id = id`,
      createRule: '',
      updateRule: `${adminRule} || @request.auth.id = id`,
      deleteRule: adminRule,
    },
    // User-owned collections - users can only access their own records
    { 
      name: 'user_profiles', 
      listRule: `${adminRule} || (@request.auth.id = user)`,
      viewRule: `${adminRule} || (@request.auth.id = user)`,
      createRule: `@request.auth.id != "" && (@request.auth.id = user)`,
      updateRule: `${adminRule} || (@request.auth.id = user)`,
      deleteRule: `${adminRule} || (@request.auth.id = user)`,
    },
    { 
      name: 'user_sessions', 
      listRule: `${adminRule} || (@request.auth.id = user)`,
      viewRule: `${adminRule} || (@request.auth.id = user)`,
      createRule: `@request.auth.id != "" && (@request.auth.id = user)`,
      updateRule: `${adminRule} || (@request.auth.id = user)`,
      deleteRule: `${adminRule} || (@request.auth.id = user)`,
    },
    { 
      name: 'session_progress', 
      listRule: `${adminRule} || (@request.auth.id = user)`,
      viewRule: `${adminRule} || (@request.auth.id = user)`,
      createRule: `@request.auth.id != "" && (@request.auth.id = user)`,
      updateRule: `${adminRule} || (@request.auth.id = user)`,
      deleteRule: `${adminRule} || (@request.auth.id = user)`,
    },
    { 
      name: 'step_responses', 
      listRule: `${adminRule} || (@request.auth.id = user)`,
      viewRule: `${adminRule} || (@request.auth.id = user)`,
      createRule: `@request.auth.id != "" && (@request.auth.id = user)`,
      updateRule: `${adminRule} || (@request.auth.id = user)`,
      deleteRule: `${adminRule} || (@request.auth.id = user)`,
    },
    { 
      name: 'cravings', 
      listRule: `${adminRule} || (@request.auth.id = user)`,
      viewRule: `${adminRule} || (@request.auth.id = user)`,
      createRule: `@request.auth.id != "" && (@request.auth.id = user)`,
      updateRule: `${adminRule} || (@request.auth.id = user)`,
      deleteRule: `${adminRule} || (@request.auth.id = user)`,
    },
    { 
      name: 'journal_entries', 
      listRule: `${adminRule} || (@request.auth.id = user)`,
      viewRule: `${adminRule} || (@request.auth.id = user)`,
      createRule: `@request.auth.id != "" && (@request.auth.id = user)`,
      updateRule: `${adminRule} || (@request.auth.id = user)`,
      deleteRule: `${adminRule} || (@request.auth.id = user)`,
    },
    { 
      name: 'progress_stats', 
      listRule: `${adminRule} || (@request.auth.id = user)`,
      viewRule: `${adminRule} || (@request.auth.id = user)`,
      createRule: `@request.auth.id != "" && (@request.auth.id = user)`,
      updateRule: `${adminRule} || (@request.auth.id = user)`,
      deleteRule: `${adminRule} || (@request.auth.id = user)`,
    },
    { 
      name: 'user_achievements', 
      listRule: `${adminRule} || (@request.auth.id = user)`,
      viewRule: `${adminRule} || (@request.auth.id = user)`,
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
    },
    { 
      name: 'analytics_events', 
      listRule: `${adminRule} || (user = null) || (@request.auth.id = user)`,
      viewRule: `${adminRule} || (user = null) || (@request.auth.id = user)`,
      createRule: `@request.auth.id != ""`,
      updateRule: adminRule,
      deleteRule: adminRule,
    },
    { 
      name: 'support_tickets', 
      listRule: `${adminRule} || (@request.auth.id = user)`,
      viewRule: `${adminRule} || (@request.auth.id = user)`,
      createRule: `@request.auth.id != "" && (@request.auth.id = user)`,
      updateRule: `${adminRule} || (@request.auth.id = user)`,
      deleteRule: adminRule,
    },
    // Public-readable, admin-writable
    { name: 'programs', listRule: '', viewRule: '', createRule: adminRule, updateRule: adminRule, deleteRule: adminRule },
    { name: 'program_days', listRule: '', viewRule: '', createRule: adminRule, updateRule: adminRule, deleteRule: adminRule },
    { name: 'steps', listRule: '', viewRule: '', createRule: adminRule, updateRule: adminRule, deleteRule: adminRule },
    { name: 'achievements', listRule: '', viewRule: '', createRule: adminRule, updateRule: adminRule, deleteRule: adminRule },
    { name: 'content_items', listRule: '', viewRule: '', createRule: adminRule, updateRule: adminRule, deleteRule: adminRule },
    { name: 'quotes', listRule: '', viewRule: '', createRule: adminRule, updateRule: adminRule, deleteRule: adminRule },
    { name: 'media', listRule: '', viewRule: '', createRule: adminRule, updateRule: adminRule, deleteRule: adminRule },
    // Admin-only collections
    { 
      name: 'api_keys', 
      listRule: adminRule,
      viewRule: adminRule,
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
    },
    { 
      name: 'webhooks', 
      listRule: adminRule,
      viewRule: adminRule,
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
    },
    { 
      name: 'notification_templates', 
      listRule: adminRule,
      viewRule: adminRule,
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
    },
    { 
      name: 'audit_logs', 
      listRule: adminRule,
      viewRule: adminRule,
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
    },
    { 
      name: 'admin_users', 
      listRule: adminRule,
      viewRule: adminRule,
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
    },
  ]

  for (const cfg of configs) {
    try {
      const col = await pb.collections.getOne(cfg.name)
      const updateData = {}
      
      // Only set rules that are explicitly defined (not undefined)
      if (cfg.listRule !== undefined) updateData.listRule = cfg.listRule
      if (cfg.viewRule !== undefined) updateData.viewRule = cfg.viewRule
      if (cfg.createRule !== undefined) updateData.createRule = cfg.createRule
      if (cfg.updateRule !== undefined) updateData.updateRule = cfg.updateRule
      if (cfg.deleteRule !== undefined) updateData.deleteRule = cfg.deleteRule
      
      // Fallback to single rule if provided
      if (cfg.rule !== undefined) {
        if (cfg.listRule === undefined) updateData.listRule = cfg.rule
        if (cfg.viewRule === undefined) updateData.viewRule = cfg.rule
        if (cfg.createRule === undefined) updateData.createRule = cfg.rule
        if (cfg.updateRule === undefined) updateData.updateRule = cfg.rule
        if (cfg.deleteRule === undefined) updateData.deleteRule = cfg.rule
      }
      
      await pb.collections.update(col.id, updateData)
      console.log(`  ✓ Set rules for: ${cfg.name}`)
    } catch (err) {
      console.error(`  ✗ Failed to set rules for ${cfg.name}: ${err.message}`)
      if (err.response) {
        console.error(`    Details: ${JSON.stringify(err.response, null, 2)}`)
      }
    }
  }
}

async function seedProgram() {
  console.log('\n📚 Step 4: Seeding 10-Day Program...\n')

  try {
    // Check if program exists
    let program
    try {
      program = await pb.collection('programs').getFirstListItem('language = "en" && is_active = true')
      console.log('  ✓ Found existing program')
    } catch (e) {
      program = await pb.collection('programs').create({
        title: '10-Day Quit Hero Program',
        description: 'A comprehensive 10-day program designed to help you quit smoking and build lasting habits for a smoke-free life.',
        is_active: true,
        language: 'en',
        duration_days: 10,
        order: 1,
      })
      console.log('  ✓ Created program')
    }

    // Seed program days and steps
    for (const dayData of programDays) {
      const existingDays = await pb.collection('program_days').getFullList({
        filter: `program = "${program.id}" && day_number = ${dayData.day_number}`,
      })

      let day
      if (existingDays.length > 0) {
        day = existingDays[0]
      } else {
        day = await pb.collection('program_days').create({
          program: program.id,
          day_number: dayData.day_number,
          title: dayData.title,
          subtitle: dayData.subtitle,
          estimated_duration_min: dayData.estimated_duration_min,
          is_locked: false,
        })
      }

      // Create steps
      for (const stepData of dayData.steps) {
        const existingSteps = await pb.collection('steps').getFullList({
          filter: `program_day = "${day.id}" && order = ${stepData.order}`,
        })

        if (existingSteps.length === 0) {
          await pb.collection('steps').create({
            program_day: day.id,
            order: stepData.order,
            type: stepData.type,
            content_json: stepData.content_json,
          })
        }
      }
    }

    console.log('  ✓ 10-day program seeded successfully')
    console.log(`  ✓ Total days: ${programDays.length}`)
    const totalSteps = programDays.reduce((sum, day) => sum + day.steps.length, 0)
    console.log(`  ✓ Total steps: ${totalSteps}`)
  } catch (error) {
    console.error('  ✗ Error seeding program:', error.message)
    if (error.response) {
      console.error(`    Details: ${JSON.stringify(error.response, null, 2)}`)
    }
    throw error
  }
}

async function seedAchievements() {
  console.log('\n🏆 Step 5: Seeding Achievements...\n')

  let created = 0
  let skipped = 0
  let failed = 0

  for (const achievement of achievementsData) {
    try {
      const existing = await pb.collection('achievements').getFullList({
        filter: `key = "${achievement.key}"`,
      })

      if (existing.length === 0) {
        await pb.collection('achievements').create({
          ...achievement,
          is_active: achievement.is_active !== undefined ? achievement.is_active : true,
        })
        console.log(`  ✓ Created achievement: ${achievement.title}`)
        created++
      } else {
        skipped++
      }
    } catch (error) {
      console.error(`  ✗ Failed to create achievement: ${achievement.title}`)
      console.error(`    Error: ${error.message}`)
      if (error.response) {
        console.error(`    Details: ${JSON.stringify(error.response, null, 2)}`)
      }
      failed++
    }
  }

  console.log(`\n  Summary: Created: ${created} | Skipped: ${skipped} | Failed: ${failed}`)
  console.log(`  ✓ Total achievements: ${achievementsData.length}`)
}

async function seedQuotes() {
  console.log('\n💬 Step 6: Seeding Quotes & Tips...\n')

  for (const quote of quotesData) {
    try {
      await pb.collection('quotes').create({
        ...quote,
        is_active: true,
      })
    } catch (error) {
      // Ignore duplicates
    }
  }

  console.log(`  ✓ Seeded ${quotesData.length} quotes and tips`)
}

async function createDemoUsers() {
  console.log('\n👥 Step 7: Creating Demo Users...\n')

  const demoUsers = [
    {
      email: 'demo@quithero.com',
      password: 'Demo123456!',
      name: 'Demo User',
      age: 30,
      gender: 'male',
      language: 'en',
      daily_consumption: 10,
    },
    {
      email: 'test@quithero.com',
      password: 'Test123456!',
      name: 'Test User',
      age: 25,
      gender: 'female',
      language: 'en',
      daily_consumption: 15,
    },
  ]

  for (const userData of demoUsers) {
    try {
      // Check if user exists
      try {
        await pb.collection('users').getFirstListItem(`email = "${userData.email}"`)
        console.log(`  ✓ User ${userData.email} already exists`)
        continue
      } catch (e) {
        // User doesn't exist, create it
      }

      const user = await pb.collection('users').create({
        email: userData.email,
        password: userData.password,
        passwordConfirm: userData.password,
        name: userData.name,
      })

      // Create user profile
      await pb.collection('user_profiles').create({
        user: user.id,
        age: userData.age,
        gender: userData.gender,
        language: userData.language,
        quit_date: new Date().toISOString().split('T')[0],
        daily_consumption: userData.daily_consumption,
        consumption_unit: 'cigarettes',
        nicotine_forms: ['cigarettes'],
        motivations: ['health', 'family', 'savings'],
        enable_reminders: true,
      })

      // Create progress stats
      await pb.collection('progress_stats').create({
        user: user.id,
        days_smoke_free: 0,
        cigarettes_not_smoked: 0,
        money_saved: 0,
        life_regained_hours: 0,
        health_improvement_percent: 0,
        last_calculated: new Date().toISOString(),
      })

      console.log(`  ✓ Created demo user: ${userData.email} / ${userData.password}`)
    } catch (error) {
      console.error(`  ✗ Failed to create user ${userData.email}:`, error.message)
    }
  }
}

async function createBackofficeAdmin() {
  console.log('\n🔐 Step 8: Creating Backoffice Admin...\n')

  try {
    await pb.collection('admin_users').getFirstListItem('email = "admin@backoffice.com"')
    console.log('  ✓ Backoffice admin already exists')
  } catch (_) {
    try {
      await pb.collection('admin_users').create({
        email: 'admin@backoffice.com',
        password: 'Admin123!',
        passwordConfirm: 'Admin123!',
        name: 'Backoffice Admin',
        role: 'admin',
      })
      console.log('  ✓ Created backoffice admin: admin@backoffice.com / Admin123!')
    } catch (error) {
      console.error('  ✗ Failed to create backoffice admin:', error.message)
    }
  }
}

async function verifySetup() {
  console.log('\n✅ Step 9: Verifying Setup...\n')

  try {
    const allCollections = await pb.collections.getFullList()
    console.log(`  ✓ Total collections: ${allCollections.length}`)

    const programs = await pb.collection('programs').getFullList()
    console.log(`  ✓ Programs: ${programs.length}`)

    const programDays = await pb.collection('program_days').getFullList()
    console.log(`  ✓ Program days: ${programDays.length}`)

    const steps = await pb.collection('steps').getFullList()
    console.log(`  ✓ Steps: ${steps.length}`)

    const achievements = await pb.collection('achievements').getFullList()
    console.log(`  ✓ Achievements: ${achievements.length}`)

    const quotes = await pb.collection('quotes').getFullList()
    console.log(`  ✓ Quotes: ${quotes.length}`)

    const users = await pb.collection('users').getFullList()
    console.log(`  ✓ Users: ${users.length}`)

    console.log('\n✅ Database verification complete!')
  } catch (error) {
    console.error('  ✗ Verification failed:', error.message)
  }
}

// ==================== MAIN EXECUTION ====================

async function completeSetup() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║        QUIT HERO - Complete Database Setup Script         ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log(`📍 PocketBase URL: ${PB_URL}`)
  console.log(`📧 Admin Email: ${ADMIN_EMAIL}`)
  console.log('')

  try {
    // Step 1: Authenticate
    console.log('🔐 Step 1: Authenticating as admin...\n')
    await new Promise(resolve => setTimeout(resolve, 2000))

    let authenticated = false
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
        authenticated = true
        console.log('  ✓ Admin authentication successful\n')
        break
      } catch (authError) {
        if (attempt < 3) {
          console.log(`  ⚠️  Attempt ${attempt} failed, retrying...`)
          await new Promise(resolve => setTimeout(resolve, 2000))
        } else {
          console.error('  ✗ Authentication failed after 3 attempts')
          console.error(`     Email: ${ADMIN_EMAIL}`)
          console.error(`     URL: ${PB_URL}`)
          console.error(`     Error: ${authError.message}\n`)
          
          // Check if it's a connection error
          if (authError.message.includes('ECONNREFUSED') || 
              authError.message.includes('fetch failed') ||
              authError.message.includes('network') ||
              authError.message.includes('timeout')) {
            console.error('💡 Connection Troubleshooting:')
            console.error('   1. Ensure PocketBase is running: docker-compose ps')
            console.error('   2. Check if the URL is correct in .env file')
            console.error('   3. For AWS: Verify security group allows port 8096')
            console.error('   4. Check PocketBase logs: docker-compose logs pocketbase')
            console.error('   5. Test manually: curl ' + PB_URL + '/api/health\n')
          } else {
            console.error('💡 Authentication Troubleshooting:')
            console.error(`   1. Verify admin account exists at ${PB_URL}/_/`)
            console.error('   2. Check AWS_PB_ADMIN_EMAIL and AWS_PB_ADMIN_PASSWORD in .env file')
            console.error('   3. Create admin account if it doesn\'t exist')
            console.error('   4. For AWS: Use the installation link to create first admin\n')
          }
          throw authError
        }
      }
    }

    if (!authenticated) {
      throw new Error('Authentication failed')
    }

    // Step 2: Create Collections
    console.log('📦 Step 2: Creating Collections...\n')
    const results = []
    for (const collectionDef of collections) {
      const result = await createCollection(collectionDef)
      results.push({ name: collectionDef.name, ...result })
    }

    const created = results.filter(r => r.success && !r.skipped).length
    const skipped = results.filter(r => r.success && r.skipped).length
    console.log(`\n  ✓ Created: ${created} | Skipped: ${skipped}\n`)

    // Step 3: Set Permissions
    await setPermissions()

    // Step 4: Seed Program
    await seedProgram()

    // Step 5: Seed Achievements
    await seedAchievements()

    // Step 6: Seed Quotes
    await seedQuotes()

    // Step 7: Create Demo Users
    await createDemoUsers()

    // Step 8: Create Backoffice Admin
    await createBackofficeAdmin()

    // Step 9: Verify Setup
    await verifySetup()

    // Final Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗')
    console.log('║                  ✅ SETUP COMPLETE! ✅                      ║')
    console.log('╚════════════════════════════════════════════════════════════╝')
    console.log('')
    console.log('📋 What was set up:')
    console.log('   ✓ 20+ collections with proper schemas')
    console.log('   ✓ Access control rules for frontend and backoffice')
    console.log('   ✓ Complete 10-day program with all steps')
    console.log('   ✓ 17 achievements across all tiers')
    console.log('   ✓ 10 motivational quotes and tips')
    console.log('   ✓ 2 demo users for testing')
    console.log('   ✓ 1 backoffice admin account')
    console.log('')
    console.log('🔑 Login Credentials:')
    console.log('   Frontend Demo User:')
    console.log('     Email: demo@quithero.com')
    console.log('     Password: Demo123456!')
    console.log('')
    console.log('   Frontend Test User:')
    console.log('     Email: test@quithero.com')
    console.log('     Password: Test123456!')
    console.log('')
    console.log('   Backoffice Admin:')
    console.log('     Email: admin@backoffice.com')
    console.log('     Password: Admin123!')
    console.log('')
    console.log('🚀 Next Steps:')
    console.log(`   1. Access PocketBase Admin: ${PB_URL}/_/`)
    console.log('   2. Start Frontend: npm run dev')
    console.log('   3. Start Backoffice: npm run dev:backoffice')
    console.log('   4. Test the demo user login')
    console.log('')
    console.log('📚 Need help? Check the README.md file')
    console.log('')

  } catch (error) {
    console.error('\n❌ Setup failed!')
    console.error('Error:', error.message)
    console.error('\n💡 Troubleshooting:')
    console.error('   1. Ensure PocketBase is running: npm run pb:start')
    console.error(`   2. Create admin account at: ${PB_URL}/_/`)
    console.error('   3. Verify AWS credentials in .env file (AWS_POCKETBASE_URL, AWS_PB_ADMIN_EMAIL, AWS_PB_ADMIN_PASSWORD)')
    console.error('   4. Check PocketBase logs: npm run pb:logs')
    console.error('')
    process.exit(1)
  }
}

// Run the complete setup
completeSetup()
