// Type definitions for Quit Hero data models

import {
  Gender,
  Language,
  StepType,
  SessionStatus,
  CravingType,
  CravingTrigger,
  Mood,
  AchievementTier,
  RequirementType,
  ContentType,
  ConsumptionUnit,
  SupportTicketStatus,
  SupportTicketPriority,
  SupportTicketCategory,
  QuitArchetype,
  EmotionalState,
} from './enums'

// User Profile (extends PocketBase users collection)
export interface UserProfile {
  id?: string
  user: string // Relation to users
  age?: number
  gender?: Gender
  language?: Language
  country?: string
  quit_date: string // Date string
  daily_reminder_time?: string // Format: "HH:MM"
  nicotine_forms?: string[] // JSON array
  how_long_using?: number // Months
  daily_consumption?: number
  consumption_unit?: ConsumptionUnit
  motivations?: string[] // JSON array
  enable_reminders?: boolean
  // New onboarding fields
  smoking_triggers?: CravingTrigger[] // Multi-select triggers
  emotional_states?: EmotionalState[] // Emotional states linked to smoking
  fear_index?: number // 0-10 scale
  quit_reason?: string // Free text - why they want to quit
  quit_archetype?: QuitArchetype // Auto-assigned based on triggers/emotional states
  subscription_status?: 'free' | 'active' | 'expired'
  subscription_started_at?: string
  subscription_country?: string
  
  // Custom onboarding upgrade fields
  onboarding_name?: string
  pack_cost?: number
  minutes_per_cigarette?: number
  started_age_range?: string
  first_use_after_waking?: string
  smoking_times?: string[]
  smoking_environments?: string[]
  primary_trigger?: string
  craving_peak_time?: string
  daily_stress_level?: string
  anxiety_social_pattern?: string
  guilt_frequency?: string
  tried_quitting_before?: string
  previous_attempt_difficulty?: string[]
  quit_attempt_count?: string
  past_quit_tools?: string[]
  primary_motivation?: string
  priority_goal?: string
  quit_goal_style?: string
  quit_confidence?: string
  cravings_worry?: string
  relapse_worry?: string
  withdrawal_worry?: string
  household_smokers?: string
  occupation_style?: string
  reminder_frequency?: string
  support_preference?: string
  checkin_time_preference?: string
  success_outcome?: string
  commitment_statement?: string
  secondary_quit_archetype?: string
  readiness_score?: number
  relapse_risk_score?: number
  support_intensity_score?: number
  onboarding_completed_at?: string
  
  created?: string
  updated?: string
}

// Program
export interface Program {
  id?: string
  title: string
  description?: string
  is_active?: boolean
  language?: Language
  duration_days?: number
  order?: number
  created?: string
  updated?: string
}

// Program Day
export interface ProgramDay {
  id?: string
  program: string // Relation to programs
  day_number: number // 1-10
  title: string
  subtitle?: string
  estimated_duration_min?: number
  is_locked?: boolean
  created?: string
  updated?: string
}

// Step Content JSON structures
export interface TextStepContent {
  title?: string
  text: string
  image_url?: string
  video_url?: string
}

export interface MCQStepContent {
  question: string
  options: string[]
  correct_answer?: number
}

export interface OpenStepContent {
  question: string
  placeholder?: string
}

export interface ExerciseStepContent {
  title?: string
  instructions: string
  text?: string
  duration_seconds?: number
}

export interface VideoStepContent {
  video_url: string
  title?: string
  description?: string
}

// Step
export interface Step {
  id?: string
  program_day: string // Relation to program_days
  order: number
  type: StepType
  content_json: TextStepContent | MCQStepContent | OpenStepContent | ExerciseStepContent | VideoStepContent
  created?: string
  updated?: string
}

// User Session
export interface UserSession {
  id?: string
  user: string // Relation to users
  program: string // Relation to programs
  current_day?: number
  status?: SessionStatus
  started_at?: string
  completed_at?: string
  created?: string
  updated?: string
}

// Session Progress
export interface SessionProgress {
  id?: string
  user: string // Relation to users
  program_day: string // Relation to program_days
  status?: SessionStatus
  last_step_index?: number
  completed_at?: string
  time_spent_minutes?: number
  created?: string
  updated?: string
}

// Step Response
export interface MCQResponse {
  selected_option: number
}

export interface OpenResponse {
  answer: string
}

export interface StepResponse {
  id?: string
  user: string // Relation to users
  step: string // Relation to steps
  response_json: MCQResponse | OpenResponse
  created?: string
  updated?: string
}

// Craving
export interface Craving {
  id?: string
  user: string // Relation to users
  type: CravingType
  intensity: number // 1-5
  trigger: CravingTrigger
  trigger_custom?: string
  notes?: string
  automatic_thought?: string
  resolution_method?: string
  resolution_time_minutes?: number
  created?: string
  updated?: string
}

// Journal Entry
export interface JournalEntry {
  id?: string
  user: string // Relation to users
  date: string // Date string
  title?: string
  content: string
  mood: Mood
  cbt_mode?: boolean
  antecedent?: string
  automatic_thought?: string
  behavioral_response?: string
  created?: string
  updated?: string
}

// Progress Stats
export interface ProgressStats {
  id?: string
  user: string // Relation to users (unique)
  days_smoke_free?: number
  cigarettes_not_smoked?: number
  money_saved?: number
  life_regained_hours?: number
  nicotine_not_consumed?: number
  health_improvement_percent?: number
  last_calculated?: string
  created?: string
  updated?: string
}

// Achievement
export interface Achievement {
  id?: string
  key: string // Unique key like "first_day"
  title: string
  description?: string
  icon?: string
  tier?: AchievementTier
  requirement_type?: RequirementType
  requirement_value?: number
  created?: string
  updated?: string
}

// User Achievement
export interface UserAchievement {
  id?: string
  user: string // Relation to users
  achievement: string // Relation to achievements
  unlocked_at?: string
  created?: string
  updated?: string
}

// Content Item
export interface ContentItem {
  id?: string
  type: ContentType
  title?: string
  content: string
  image_url?: string
  language?: Language
  is_active?: boolean
  order?: number
  created?: string
  updated?: string
}

// Analytics Event
export interface AnalyticsEvent {
  id?: string
  user?: string // Relation to users (nullable for anonymous)
  event_type: string
  meta?: Record<string, any> // JSON
  created?: string
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Progress Calculation Result
export interface ProgressCalculation {
  days_smoke_free: number
  cigarettes_not_smoked: number
  money_saved: number
  life_regained_hours: number
  nicotine_not_consumed: number
  cigarettes_smoked: number
}

// Support Ticket
export interface SupportTicket {
  id?: string
  user: string // Relation to users
  subject: string
  message?: string
  description?: string
  status: SupportTicketStatus
  priority?: SupportTicketPriority
  category?: SupportTicketCategory
  assigned_to?: string // Relation to admin_users
  created?: string
  updated?: string
}

// ─── OKF Behavioral AI Types ───────────────────────────────────────────────

export type LearningPhase = 'observing' | 'active'
export type IntensityTrend = 'rising' | 'stable' | 'falling'
export type MoodTrend = 'improving' | 'stable' | 'declining'
export type NotificationStyle = 'motivational' | 'grounding' | 'factual' | 'challenge'
export type NotificationTriggerType = 'scheduled' | 'craving_spike' | 'missed_session' | 'slip'

export interface UserBehaviorProfile {
  id?: string
  user: string

  // Timing patterns
  peak_active_hour: number
  peak_active_hour_2?: number
  craving_peak_hour?: number

  // Engagement patterns
  avg_session_minutes: number
  preferred_step_types: StepType[]
  typical_dropout_step?: number

  // Emotional patterns
  dominant_trigger: CravingTrigger
  avg_craving_intensity: number
  intensity_trend: IntensityTrend
  mood_trend: MoodTrend

  // Archetype confidence
  assigned_archetype: QuitArchetype
  behavioral_archetype: QuitArchetype
  archetype_confidence: number

  // Notification response
  best_notification_hour?: number
  best_notification_style: NotificationStyle
  notification_open_rate: number

  // Learning state
  learning_phase: LearningPhase
  days_observed: number
  last_updated: string

  created?: string
  updated?: string
}

export interface NotificationEvent {
  id?: string
  user: string
  trigger_type: NotificationTriggerType
  message_title: string
  message_body: string
  archetype_at_send: QuitArchetype
  day_number: number
  sent_at: string
  opened_at?: string
  led_to_session: boolean
  created?: string
  updated?: string
}

export interface PersonalizationLog {
  id?: string
  user: string
  day_number: number
  request_type: 'session_content' | 'notification' | 'behavior_update'
  archetype_used: QuitArchetype
  okf_docs_loaded: string[]
  ai_response_summary: string
  content_payload?: PersonalizedContent
  content_fit_score?: number
  created?: string
}

export interface BehaviorSignal {
  type: 'page_view' | 'session_complete' | 'craving_logged' | 'step_dropped' |
        'notification_opened' | 'notification_sent' | 'journal_entry' | 'slip'
  timestamp: string
  meta: Record<string, any>
}

export interface TriggerCheckContent {
  question: string
  options: string[]
}

export interface ComprehensionCheckContent {
  question: string
  options: string[]
  correct_index: number
  thought_of_the_day: [string, string]
  reread_hint: string
}

export interface PersonalizedContent {
  session_intro?: string
  module_reframes?: Record<number, string>
  exercise_motivation?: string
  closing_reflection?: string
  journal_prompt?: string
  trigger_check?: TriggerCheckContent
  comprehension_check?: ComprehensionCheckContent
}

export interface NotificationMessage {
  title: string
  body: string
  trigger_type: NotificationTriggerType
  archetype: QuitArchetype
  rationale?: string
}

