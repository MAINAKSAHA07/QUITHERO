// Enums for Quit Hero application

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum Language {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  HI = 'hi',
  DE = 'de',
  ZH = 'zh',
}

export enum StepType {
  TEXT = 'text',
  QUESTION_MCQ = 'question_mcq',
  QUESTION_OPEN = 'question_open',
  EXERCISE = 'exercise',
  VIDEO = 'video',
  AUDIO = 'audio',
}

export enum SessionStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum CravingType {
  CRAVING = 'craving',
  SLIP = 'slip',
}

export enum CravingTrigger {
  STRESS = 'stress',
  BOREDOM = 'boredom',
  SOCIAL = 'social',
  HABIT = 'habit',
  OTHER = 'other',
}

export enum Mood {
  VERY_HAPPY = 'very_happy',
  HAPPY = 'happy',
  NEUTRAL = 'neutral',
  SAD = 'sad',
  VERY_SAD = 'very_sad',
}

export enum AchievementTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

export enum RequirementType {
  DAYS_STREAK = 'days_streak',
  CRAVINGS_RESISTED = 'cravings_resisted',
  SESSIONS_COMPLETED = 'sessions_completed',
}

export enum ContentType {
  ARTICLE = 'article',
  QUOTE = 'quote',
  TIP = 'tip',
}

export enum ConsumptionUnit {
  CIGARETTES = 'cigarettes',
  ML = 'ml',
  GRAMS = 'grams',
}

