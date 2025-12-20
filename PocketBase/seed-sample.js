import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const seed = async () => {
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)

  // ensure test user
  let userId
  try {
    const u = await pb.collection('users').create({
      email: 'demo_user@example.com',
      password: 'DemoUser123!',
      passwordConfirm: 'DemoUser123!',
      name: 'Demo User',
    })
    userId = u.id
  } catch (e) {
    const existing = await pb.collection('users').getFirstListItem('email = "demo_user@example.com"')
    userId = existing.id
  }

  // program
  const program = await pb.collection('programs').create({
    title: '10-Day Kickstart',
    description: 'Intro program',
    is_active: true,
    language: 'en',
    duration_days: 10,
    order: 1,
  })

  // program day
  const day1 = await pb.collection('program_days').create({
    program: program.id,
    day_number: 1,
    title: 'Day 1 - Foundations',
    subtitle: 'Start strong',
    estimated_duration_min: 15,
    is_locked: false,
  })

  // steps
  await pb.collection('steps').create({
    program_day: day1.id,
    order: 1,
    type: 'text',
    content_json: { text: 'Welcome to Day 1', image_url: '' },
  })
  await pb.collection('steps').create({
    program_day: day1.id,
    order: 2,
    type: 'question_open',
    content_json: { question: 'Why do you want to quit?', placeholder: 'Your reason' },
  })

  // user profile
  await pb.collection('user_profiles').create({
    user: userId,
    age: 30,
    gender: 'male',
    language: 'en',
    quit_date: new Date().toISOString(),
    daily_reminder_time: '09:00',
    nicotine_forms: ['cigarettes'],
    how_long_using: 60,
    daily_consumption: 10,
    consumption_unit: 'cigarettes',
    motivations: ['health', 'family'],
    enable_reminders: true,
  })

  // session + progress
  const session = await pb.collection('user_sessions').create({
    user: userId,
    program: program.id,
    current_day: 1,
    status: 'in_progress',
    started_at: new Date().toISOString(),
  })
  await pb.collection('session_progress').create({
    user: userId,
    program_day: day1.id,
    status: 'in_progress',
    last_step_index: 0,
    time_spent_minutes: 5,
  })

  // cravings
  await pb.collection('cravings').create({
    user: userId,
    type: 'craving',
    intensity: 3,
    trigger: 'stress',
    notes: 'After work',
  })

  // journal
  await pb.collection('journal_entries').create({
    user: userId,
    date: new Date().toISOString().slice(0,10),
    mood: 'neutral',
    title: 'Day 1 check-in',
    content: 'Feeling okay',
  })

  // progress stats
  await pb.collection('progress_stats').create({
    user: userId,
    days_smoke_free: 1,
    cigarettes_not_smoked: 10,
    money_saved: 80,
    life_regained_hours: 2,
    health_improvement_percent: 5,
    last_calculated: new Date().toISOString(),
  })

  // achievements and user_achievements
  const ach = await pb.collection('achievements').create({
    key: 'first_day',
    title: 'First Day',
    description: 'Completed first day',
    tier: 'bronze',
    requirement_type: 'days_streak',
    requirement_value: 1,
    is_active: true,
    order: 1,
  })
  await pb.collection('user_achievements').create({
    user: userId,
    achievement: ach.id,
    unlocked_at: new Date().toISOString(),
    unlock_method: 'automatic',
  })

  // analytics events
  await pb.collection('analytics_events').create({
    user: userId,
    event_type: 'app_open',
    meta: { source: 'seed' },
  })

  // content items and quotes
  await pb.collection('content_items').create({
    title: 'Article 1',
    content: 'Content body',
    type: 'article',
    language: 'en',
    status: 'published',
    is_active: true,
  })
  await pb.collection('quotes').create({
    type: 'quote',
    content: 'Keep going!',
    author: 'Coach',
    language: 'en',
    is_active: true,
  })

  // support tickets
  await pb.collection('support_tickets').create({
    user: userId,
    subject: 'Need help',
    message: 'How to use the app?',
    status: 'open',
    priority: 'low',
    category: 'support',
  })

  // media
  await pb.collection('media').create({
    filename: 'sample.jpg',
    type: 'image',
    url: 'https://via.placeholder.com/150',
    size: 12345,
    folder: 'general',
  })

  // api_keys (dummy)
  await pb.collection('api_keys').create({
    name: 'dev-key',
    key: 'dev-key-123',
    permissions: { all: true },
    status: 'active',
  })

  // webhooks
  await pb.collection('webhooks').create({
    url: 'https://example.com/webhook',
    events: ['user_created'],
    status: 'active',
    secret: 'secret123',
  })

  // audit logs
  await pb.collection('audit_logs').create({
    action: 'seed_data',
    action_type: 'settings_changes',
    entity_type: 'seed',
    entity_id: 'seed-1',
    details: { by: 'seed script' },
    timestamp: new Date().toISOString(),
  })

  console.log('Seed data created for demo_user@example.com')
}

seed().catch(err => { console.error(err); process.exit(1); })
