export interface KYCQuestion {
  id: string
  group: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H'
  question: string
  support: string
  type: 'single_select' | 'multi_select' | 'slider' | 'text' | 'textarea' | 'time' | 'country_select'
  options?: string[]
  min?: number
  max?: number
  step?: number
  unit?: string
  required?: boolean
  maxSelect?: number
  profileField: string
  showIf?: {
    field: string
    values: string[]
  }
  whyWeAsk?: string
}

export const kycQuestions: KYCQuestion[] = [
  // ================= GROUP A: Personal Profile =================
  {
    id: 'onboarding_name',
    group: 'A',
    question: 'What is your first name?',
    support: 'We want to address you personally on your journey.',
    type: 'text',
    required: true,
    profileField: 'onboarding_name',
    whyWeAsk: 'Your name is only used to personalize your daily modules and reminders.'
  },
  {
    id: 'phone',
    group: 'A',
    question: 'What is your phone number?',
    support: 'Optional — so we can reach you if you need support.',
    type: 'text',
    required: false,
    profileField: 'phone',
    whyWeAsk: 'Used only for account recovery and support. You can skip this and add it later in Profile.'
  },
  {
    id: 'country',
    group: 'A',
    question: 'What country do you live in?',
    support: 'This helps us localize pricing and currency settings.',
    type: 'country_select',
    required: true,
    profileField: 'country',
    whyWeAsk: 'Cost calculations are based on standard local cigarette prices.'
  },
  {
    id: 'age',
    group: 'A',
    question: 'What is your age?',
    support: 'QUITHERO is calibrated for adults aged 18 to 75.',
    type: 'slider',
    min: 18,
    max: 75,
    step: 1,
    unit: 'years old',
    required: true,
    profileField: 'age',
    whyWeAsk: 'Behavioral pattern metrics vary with age groups.'
  },
  {
    id: 'gender',
    group: 'A',
    question: 'What is your gender?',
    support: 'Choose the option you identify with.',
    type: 'single_select',
    options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
    required: true,
    profileField: 'gender',
    whyWeAsk: 'This is used purely to build a comfortable support experience.'
  },
  {
    id: 'language',
    group: 'A',
    question: 'What is your main language for learning modules?',
    support: 'Your daily CBT exercises will be delivered in this language.',
    type: 'single_select',
    options: [
      'English',
      'Hindi',
      'Marathi',
      'Gujarati',
      'Español',
      'Français',
      'Deutsch',
      'Italiano',
      '中文'
    ],
    required: true,
    profileField: 'language',
    whyWeAsk: 'You can change your language settings anytime in your profile.'
  },

  // ================= GROUP B: Nicotine Profile =================
  {
    id: 'nicotine_forms',
    group: 'B',
    question: 'What form of nicotine do you consume?',
    support: 'Select all forms you currently use.',
    type: 'multi_select',
    options: ['Cigarettes', 'Vaping / E-Cigarettes', 'Hookah / Sheesha', 'Smokeless tobacco', 'Chewing tobacco', 'Other'],
    required: true,
    profileField: 'nicotine_forms',
    whyWeAsk: 'We personalize reframe prompts depending on your usage.'
  },
  {
    id: 'how_long_using',
    group: 'B',
    question: 'How long have you been using nicotine?',
    support: 'An estimate of your total history.',
    type: 'single_select',
    options: ['Under 1 year', '1–3 years', '3–5 years', '5–10 years', '10+ years'],
    required: true,
    profileField: 'how_long_using',
    whyWeAsk: 'Helps us estimate your total chemical exposure and habit strength.'
  },
  {
    id: 'daily_consumption',
    group: 'B',
    question: 'How many units or cigarettes do you use per day?',
    support: 'On an average day, how much do you consume?',
    type: 'slider',
    min: 1,
    max: 80,
    step: 1,
    unit: 'per day',
    required: true,
    profileField: 'daily_consumption',
    whyWeAsk: 'Essential for calculating daily cash savings and health recovery milestones.'
  },
  {
    id: 'pack_cost',
    group: 'B',
    question: 'What is the approximate cost of a pack of 20 cigarettes (or equivalent)?',
    support: 'Enter the cost in your local currency.',
    type: 'slider',
    min: 10,
    max: 2000,
    step: 10,
    required: true,
    profileField: 'pack_cost',
    whyWeAsk: 'Enables us to track how much money you save on a daily basis.'
  },
  {
    id: 'minutes_per_cigarette',
    group: 'B',
    question: 'How many minutes do you spend per cigarette or session?',
    support: 'From lighting up to putting it out.',
    type: 'slider',
    min: 2,
    max: 20,
    step: 1,
    unit: 'minutes',
    required: true,
    profileField: 'minutes_per_cigarette',
    whyWeAsk: 'This translates into active time reclaimed once you stop.'
  },
  {
    id: 'started_age_range',
    group: 'B',
    question: 'At what age did you start using nicotine?',
    support: 'Helps map the depth of the pathway.',
    type: 'single_select',
    options: ['Under 18', '18–21', '22–25', '26+'],
    required: true,
    profileField: 'started_age_range',
    whyWeAsk: 'Nicotine pathways formed during teenage years are often deeply embedded habits.'
  },
  {
    id: 'first_use_after_waking',
    group: 'B',
    question: 'When do you usually consume nicotine after waking?',
    support: 'Your first use of the day.',
    type: 'single_select',
    options: ['Within 5 minutes', 'Within 30 minutes', 'Within 1 hour', 'Later in the day'],
    required: true,
    profileField: 'first_use_after_waking',
    whyWeAsk: 'An index of physical nicotine dependence.'
  },

  // ================= GROUP C: Trigger Pattern =================
  {
    id: 'smoking_times',
    group: 'C',
    question: 'When do you typically smoke or use nicotine?',
    support: 'Select all times that apply to your daily routine.',
    type: 'multi_select',
    options: [
      'First thing in the morning',
      'After meals',
      'With coffee or tea',
      'During work breaks',
      'When stressed',
      'In the evening to unwind',
      'While socializing',
      'When drinking alcohol',
      'Before sleeping',
      'While driving or commuting',
      'When bored',
      'Other'
    ],
    required: true,
    profileField: 'smoking_times',
    whyWeAsk: 'Helps us build customized check-in times around your peak smoking hours.'
  },
  {
    id: 'smoking_environments',
    group: 'C',
    question: 'What is your primary smoking environment?',
    support: 'Where does it happen most frequently?',
    type: 'multi_select',
    options: [
      'Socializing with friends',
      'Alone at home',
      'Driving / commuting',
      'Work breaks',
      'Stressful moments'
    ],
    required: true,
    profileField: 'smoking_environments',
    whyWeAsk: 'Environment is a powerful cue. We help you create cues to counter them.'
  },
  {
    id: 'primary_trigger',
    group: 'C',
    question: 'What triggers you most?',
    support: 'Pick the single most common catalyst.',
    type: 'single_select',
    options: [
      'Stress & anxiety',
      'Coffee / alcohol pairings',
      'Social pressure',
      'Boredom / driving',
      'Finishing meals'
    ],
    required: true,
    profileField: 'primary_trigger',
    whyWeAsk: 'Your core program is designed around dismantling this primary trigger.'
  },
  {
    id: 'craving_peak_time',
    group: 'C',
    question: 'When are cravings strongest for you?',
    support: 'The time of day when it is hardest to resist.',
    type: 'single_select',
    options: [
      'Early mornings',
      'Midday work breaks',
      'Evenings',
      'Late at night',
      'Random / variable times'
    ],
    required: true,
    profileField: 'craving_peak_time',
    whyWeAsk: 'Allows us to send supportive tips right before your peak craving window.'
  },

  // ================= GROUP D: Emotional Pattern =================
  {
    id: 'emotional_states',
    group: 'D',
    question: 'How do you feel right before or while smoking?',
    support: 'Select the primary moods linked to your habit.',
    type: 'multi_select',
    options: ['Stressed', 'Anxious', 'Bored', 'Lonely', 'Sad', 'Angry', 'Happy', 'Excited'],
    required: true,
    profileField: 'emotional_states',
    whyWeAsk: 'Mindfulness and CBT help you decouple these moods from the physical urge.'
  },
  {
    id: 'daily_stress_level',
    group: 'D',
    question: 'How stressed do you feel day to day?',
    support: 'Your baseline stress level.',
    type: 'single_select',
    options: ['Low stress', 'Moderate stress', 'High stress', 'Overwhelming stress'],
    required: true,
    profileField: 'daily_stress_level',
    whyWeAsk: 'Stress is the #1 trigger for slips. We calibrate your stress rescue tools accordingly.'
  },
  {
    id: 'anxiety_social_pattern',
    group: 'D',
    question: 'Do you smoke more when anxious or socializing?',
    support: 'Compare your solitary vs. social triggers.',
    type: 'single_select',
    options: [
      'Mostly when anxious / alone',
      'Mostly when socializing / drinking',
      'Both equally',
      'Neither'
    ],
    required: true,
    profileField: 'anxiety_social_pattern',
    whyWeAsk: 'Clarifies whether you need solitary emotional support or social boundary scripts.'
  },
  {
    id: 'guilt_frequency',
    group: 'D',
    question: 'How often do you feel guilty about smoking?',
    support: 'Be honest. Shame-free observation is key.',
    type: 'single_select',
    options: ['Every single time I smoke', 'Frequently', 'Occasionally', 'Rarely / Never'],
    required: true,
    profileField: 'guilt_frequency',
    whyWeAsk: 'CBT works on replacing self-guilt with clinical, analytical curiosity.'
  },

  // ================= GROUP E: Quit History =================
  {
    id: 'tried_quitting_before',
    group: 'E',
    question: 'Have you tried quitting before?',
    support: 'Past experience helps prepare this reset.',
    type: 'single_select',
    options: ['Yes, once', 'Yes, multiple times', 'No, this is my first time'],
    required: true,
    profileField: 'tried_quitting_before',
    whyWeAsk: 'Each past attempt is a lesson, not a failure. We build on what you learned.'
  },
  {
    id: 'previous_attempt_difficulty',
    group: 'E',
    question: 'What made previous attempts difficult?',
    support: 'Select the main barriers you encountered.',
    type: 'multi_select',
    options: [
      'Intense cravings & urges',
      'Social events / peer pressure',
      'High stress / life events',
      'Mood swings / irritability',
      'Lack of a structured program',
      'I have not tried before'
    ],
    required: true,
    profileField: 'previous_attempt_difficulty',
    showIf: {
      field: 'tried_quitting_before',
      values: ['Yes, once', 'Yes, multiple times']
    },
    whyWeAsk: 'We address these specific obstacles in your daily module focus.'
  },
  {
    id: 'quit_attempt_count',
    group: 'E',
    question: 'How many times have you tried to cut back or quit?',
    support: 'Approximate number of serious attempts.',
    type: 'single_select',
    options: ['Never, this is my first attempt', '1 to 3 times', '4 to 10 times', 'Lost count'],
    required: true,
    profileField: 'quit_attempt_count',
    showIf: {
      field: 'tried_quitting_before',
      values: ['Yes, once', 'Yes, multiple times']
    },
    whyWeAsk: 'Helps evaluate habit persistence and target cognitive strategies.'
  },
  {
    id: 'past_quit_tools',
    group: 'E',
    question: 'Have you used any tools to cut down or quit?',
    support: 'Methods you have previously experimented with.',
    type: 'multi_select',
    options: [
      'Nicotine gum or patches',
      'Medication',
      'Naturopathy / homeopathy / ayurveda',
      'Hypnosis',
      'Acupuncture',
      'Cold turkey',
      'Quit smoking apps',
      'Counselling or therapy',
      'No, I haven’t used anything yet'
    ],
    required: true,
    profileField: 'past_quit_tools',
    whyWeAsk: 'Helps us see what delivery mechanics fit your preference.'
  },

  // ================= GROUP F: Motivation and Readiness =================
  {
    id: 'primary_motivation',
    group: 'F',
    question: 'Why do you want to quit smoking?',
    support: 'Choose your strongest underlying motive.',
    type: 'single_select',
    options: [
      'Physical health / breathing quality',
      'Family & loved ones',
      'Financial savings',
      'Self-confidence / freedom',
      'Social / hygiene'
    ],
    required: true,
    profileField: 'primary_motivation',
    whyWeAsk: 'We highlight this personal motivation as an anchor when cravings peak.'
  },
  {
    id: 'motivations',
    group: 'F',
    question: 'Why do you want to change your smoking habits?',
    support: 'Select up to 3 core drivers.',
    type: 'multi_select',
    maxSelect: 3,
    options: [
      'Improve my health',
      'For my family',
      'Save money',
      'Feel more energetic',
      'Mental peace',
      'More time in the day',
      'Feel better about myself',
      'Improve appearance',
      'Feel in control again',
      'Prepare for a new chapter in life'
    ],
    required: true,
    profileField: 'motivations',
    whyWeAsk: 'Focusing on positive, values-based goals increases success rates.'
  },
  {
    id: 'priority_goal',
    group: 'F',
    question: 'What matters most to you right now?',
    support: 'Your most immediate target.',
    type: 'single_select',
    options: [
      'Saving cash immediately',
      'Clear lungs & better stamina',
      'Protecting my family from second-hand smoke',
      'Gaining self-discipline'
    ],
    required: true,
    profileField: 'priority_goal',
    whyWeAsk: 'We frame your daily dashboard stats to match this priority.'
  },
  {
    id: 'quit_goal_style',
    group: 'F',
    question: 'How do you want to change your relationship with smoking?',
    support: 'Define your destination.',
    type: 'single_select',
    options: [
      'I want to quit completely',
      'I want to reduce first, then quit',
      'I have already quit and want to stay smoke-free',
      'I’m not sure yet'
    ],
    required: true,
    profileField: 'quit_goal_style',
    whyWeAsk: 'We adjust the rate of your program steps to align with your goal.'
  },
  {
    id: 'quit_confidence',
    group: 'F',
    question: 'How confident are you about quitting this time?',
    support: 'Be fully honest. Hesitation is normal.',
    type: 'single_select',
    options: [
      'Very confident',
      'Moderately confident',
      'A bit nervous / hesitant',
      'Extremely anxious'
    ],
    required: true,
    profileField: 'quit_confidence',
    whyWeAsk: 'Nervousness is natural. We add extra reassurance modules if you feel anxious.'
  },
  {
    id: 'quit_reason',
    group: 'F',
    question: 'Tell us more about why you want to quit.',
    support: 'Write a few lines for yourself. Optional.',
    type: 'textarea',
    required: false,
    profileField: 'quit_reason',
    whyWeAsk: 'We show you this note whenever you click the SOS Craving Rescue button.'
  },

  // ================= GROUP G: Fears and Support Needs =================
  {
    id: 'fear_index',
    group: 'G',
    question: 'How afraid are you of the health consequences of continued smoking?',
    support: 'Rate from 0 (No fear) to 10 (Maximum fear).',
    type: 'slider',
    min: 0,
    max: 10,
    step: 1,
    required: true,
    profileField: 'fear_index',
    whyWeAsk: 'A high fear index suggests we focus on health stats; a low one, on habit restructuring.'
  },
  {
    id: 'cravings_worry',
    group: 'G',
    question: 'Are you worried about cravings?',
    support: 'Cravings are temporary chemical signals.',
    type: 'single_select',
    options: ['Very worried', 'Slightly worried', 'Not worried'],
    required: true,
    profileField: 'cravings_worry',
    whyWeAsk: 'If you are worried, we place the SOS craving widget prominently on your home screen.'
  },
  {
    id: 'relapse_worry',
    group: 'G',
    question: 'Are you worried about relapse or slipping?',
    support: 'A slip is a data point, not a failure.',
    type: 'single_select',
    options: ['Very worried', 'Slightly worried', 'Not worried'],
    required: true,
    profileField: 'relapse_worry',
    whyWeAsk: 'Understanding worry helps us deliver non-punitive re-engagement modules.'
  },
  {
    id: 'withdrawal_worry',
    group: 'G',
    question: 'Are you worried about physical withdrawal symptoms?',
    support: 'Most physical symptoms fade in 72 hours.',
    type: 'single_select',
    options: ['Very worried', 'Slightly worried', 'Not worried'],
    required: true,
    profileField: 'withdrawal_worry',
    whyWeAsk: 'We provide clear timelines for physical healing if this is a concern.'
  },
  {
    id: 'household_smokers',
    group: 'G',
    question: 'Do you live with other smokers?',
    support: 'Your direct social environment.',
    type: 'single_select',
    options: [
      'Yes, partner smokes',
      'Yes, family members smoke',
      'Yes, roommates smoke',
      'No, smoke-free household'
    ],
    required: true,
    profileField: 'household_smokers',
    whyWeAsk: 'Living with smokers requires specialized boundary setting. We tailor tips for this.'
  },
  {
    id: 'occupation_style',
    group: 'G',
    question: 'What is your current occupation style?',
    support: 'This is optional. Helps us fit check-ins into your day.',
    type: 'single_select',
    required: false,
    options: [
      'Desk job / office worker',
      'Physical labor / outdoors',
      'Student / learning',
      'Homemaker / full-time parent',
      'Retired / unemployed',
      'Other'
    ],
    profileField: 'occupation_style',
    whyWeAsk: 'Desk workers and field workers have completely different trigger routines.'
  },

  // ================= GROUP H: Reminders and Commitment =================
  {
    id: 'reminder_frequency',
    group: 'H',
    question: 'Do you want daily check-in reminders?',
    support: 'Choose your desired notification level.',
    type: 'single_select',
    options: [
      'Yes, morning and evening',
      'Yes, mornings only',
      'Yes, evenings only',
      'No, I’ll log in manually'
    ],
    required: true,
    profileField: 'reminder_frequency',
    whyWeAsk: 'We only send notifications that keep you supported, never spam.'
  },
  {
    id: 'support_preference',
    group: 'H',
    question: 'How much support do you prefer?',
    support: 'We calibrate the frequency of encouraging prompts.',
    type: 'single_select',
    options: [
      'Max support: reminders, quotes, SOS support',
      'Balanced: standard daily modules only',
      'Quiet: self-guided, no extra notifications'
    ],
    required: true,
    profileField: 'support_preference',
    whyWeAsk: 'Allows you to control the exact pacing of our interaction.'
  },
  {
    id: 'checkin_time_preference',
    group: 'H',
    question: 'What time of day works best for check-ins?',
    support: 'Set your preferred delivery window.',
    type: 'single_select',
    options: [
      'Morning: 8 AM to 10 AM',
      'Lunchtime: 12 PM to 2 PM',
      'Evening: 6 PM to 8 PM',
      'Bedtime: 9 PM to 11 PM'
    ],
    required: true,
    profileField: 'checkin_time_preference',
    whyWeAsk: 'We match check-ins to your free periods to prevent disruption.'
  },
  {
    id: 'success_outcome',
    group: 'H',
    question: 'What outcome makes this journey successful for you?',
    support: 'Define what winning looks like.',
    type: 'single_select',
    options: [
      '100% smoke-free',
      'Reducing daily intake significantly',
      'Staying smoke-free for at least 6 months',
      'Better respiratory health and breathing'
    ],
    required: true,
    profileField: 'success_outcome',
    whyWeAsk: 'Your success definition aligns your metrics and milestone triggers.'
  },
  {
    id: 'commitment_statement',
    group: 'H',
    question: 'Final Commitment: Will you take the first step today?',
    support: 'A personal pledge to keep you accountable.',
    type: 'single_select',
    options: [
      'I commit to my smoke-free future',
      'I commit to taking it day by day'
    ],
    required: true,
    profileField: 'commitment_statement',
    whyWeAsk: 'Making an explicit commitment significantly improves day-1 compliance.'
  }
]
