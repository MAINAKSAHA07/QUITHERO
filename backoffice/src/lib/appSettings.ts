import { adminCollectionHelpers } from './pocketbase'

const GLOBAL_KEY = 'global'

export const DEFAULT_APP_SETTINGS = {
  general: {
    appName: 'smono',
    tagline: 'Your Journey to Freedom',
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es', 'fr', 'hi'],
    timeZone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
  },
  userDefaults: {
    defaultProgram: '',
    defaultReminderTime: '09:00',
    emailVerificationRequired: true,
    phoneVerificationRequired: false,
    minimumAge: 18,
  },
  content: {
    articleOfTheDayEnabled: true,
    randomQuoteEnabled: true,
    quoteRotationFrequency: 'daily',
    contentApprovalRequired: false,
  },
  notifications: {
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: false,
    pushNotificationsEnabled: true,
    dailyReminderDefault: true,
    achievementNotifications: true,
  },
  security: {
    sessionTimeout: 30,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumber: true,
    passwordRequireSpecialChar: true,
    passwordExpiry: 0,
    twoFactorAuth: false,
    ipWhitelist: '',
  },
  integrations: {
    emailProvider: 'sendgrid',
    emailApiKey: '',
    emailFrom: 'noreply@smono.com',
    emailFromName: 'smono',
    smsProvider: 'twilio',
    smsApiKey: '',
    smsFromNumber: '',
    googleAnalyticsId: '',
    facebookPixelId: '',
  },
  dataPrivacy: {
    dataRetentionDays: 365,
    anonymizeAfterDays: 730,
    gdprCompliance: true,
    termsOfServiceUrl: '',
    privacyPolicyUrl: '',
    cookiePolicyUrl: '',
    dataExportFormat: 'json',
  },
}

export type AppSettingsState = typeof DEFAULT_APP_SETTINGS

function mergeSettings(stored: Partial<AppSettingsState> | null | undefined): AppSettingsState {
  const s = stored && typeof stored === 'object' ? stored : {}
  return {
    general: { ...DEFAULT_APP_SETTINGS.general, ...s.general },
    userDefaults: { ...DEFAULT_APP_SETTINGS.userDefaults, ...s.userDefaults },
    content: { ...DEFAULT_APP_SETTINGS.content, ...s.content },
    notifications: { ...DEFAULT_APP_SETTINGS.notifications, ...s.notifications },
    security: { ...DEFAULT_APP_SETTINGS.security, ...s.security },
    integrations: { ...DEFAULT_APP_SETTINGS.integrations, ...s.integrations },
    dataPrivacy: { ...DEFAULT_APP_SETTINGS.dataPrivacy, ...s.dataPrivacy },
  }
}

export async function loadAppSettings(): Promise<AppSettingsState> {
  const result = await adminCollectionHelpers.getFullList('app_settings', {
    filter: `key = "${GLOBAL_KEY}"`,
  })
  const row = result.data?.[0] as { settings?: Partial<AppSettingsState> } | undefined
  return mergeSettings(row?.settings)
}

export async function saveAppSettings(settings: AppSettingsState): Promise<void> {
  const existing = await adminCollectionHelpers.getFullList('app_settings', {
    filter: `key = "${GLOBAL_KEY}"`,
  })
  const row = existing.data?.[0] as { id: string } | undefined
  if (row?.id) {
    const result = await adminCollectionHelpers.update('app_settings', row.id, {
      settings,
    })
    if (!result.success) throw new Error(result.error || 'Failed to save settings')
    return
  }
  const result = await adminCollectionHelpers.create('app_settings', {
    key: GLOBAL_KEY,
    settings,
  })
  if (!result.success) throw new Error(result.error || 'Failed to save settings')
}
