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
} from './enums'

// User Profile (extends PocketBase users collection)
export interface UserProfile {
  id?: string
  user: string // Relation to users
  age?: number
  gender?: Gender
  language?: Language
  quit_date: string // Date string
  daily_reminder_time?: string // Format: "HH:MM"
  nicotine_forms?: string[] // JSON array
  how_long_using?: number // Months
  daily_consumption?: number
  consumption_unit?: ConsumptionUnit
  motivations?: string[] // JSON array
  enable_reminders?: boolean
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
  instructions: string
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

