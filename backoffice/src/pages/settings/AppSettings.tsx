import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { Save, Globe, Users, FileText, Bell, Shield, Plug, Database } from 'lucide-react'

export const AppSettings = () => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<string>('general')
  const [isSaving, setIsSaving] = useState(false)

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'user_defaults', label: 'User Defaults', icon: Users },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'data_privacy', label: 'Data & Privacy', icon: Database },
  ]

  // Note: Settings would typically be stored in a 'settings' collection or as environment variables
  // For now, we'll use local state
  const [settings, setSettings] = useState({
    general: {
      appName: 'Quit Hero',
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
      emailFrom: 'noreply@quithero.com',
      emailFromName: 'Quit Hero',
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
  })

  const handleSave = async (tabId: string) => {
    setIsSaving(true)
    try {
      // In a real implementation, you'd save to PocketBase settings collection
      // For now, we'll just simulate a save
      await new Promise(resolve => setTimeout(resolve, 500))
      alert(`${tabs.find(t => t.id === tabId)?.label} settings saved successfully!`)
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <GeneralSettings
            settings={settings.general}
            onChange={(newSettings) => setSettings({ ...settings, general: newSettings })}
            onSave={() => handleSave('general')}
            isSaving={isSaving}
          />
        )
      case 'user_defaults':
        return (
          <UserDefaultsSettings
            settings={settings.userDefaults}
            onChange={(newSettings) => setSettings({ ...settings, userDefaults: newSettings })}
            onSave={() => handleSave('user_defaults')}
            isSaving={isSaving}
          />
        )
      case 'content':
        return (
          <ContentSettings
            settings={settings.content}
            onChange={(newSettings) => setSettings({ ...settings, content: newSettings })}
            onSave={() => handleSave('content')}
            isSaving={isSaving}
          />
        )
      case 'notifications':
        return (
          <NotificationSettings
            settings={settings.notifications}
            onChange={(newSettings) => setSettings({ ...settings, notifications: newSettings })}
            onSave={() => handleSave('notifications')}
            isSaving={isSaving}
          />
        )
      case 'security':
        return (
          <SecuritySettings
            settings={settings.security}
            onChange={(newSettings) => setSettings({ ...settings, security: newSettings })}
            onSave={() => handleSave('security')}
            isSaving={isSaving}
          />
        )
      case 'integrations':
        return (
          <IntegrationsSettings
            settings={settings.integrations}
            onChange={(newSettings) => setSettings({ ...settings, integrations: newSettings })}
            onSave={() => handleSave('integrations')}
            isSaving={isSaving}
          />
        )
      case 'data_privacy':
        return (
          <DataPrivacySettings
            settings={settings.dataPrivacy}
            onChange={(newSettings) => setSettings({ ...settings, dataPrivacy: newSettings })}
            onSave={() => handleSave('data_privacy')}
            isSaving={isSaving}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-neutral-dark">App Settings</h1>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-card p-6">
        {renderTabContent()}
      </div>
    </div>
  )
}

// Settings Components
interface SettingsComponentProps {
  settings: any
  onChange: (settings: any) => void
  onSave: () => void
  isSaving: boolean
}

const GeneralSettings: React.FC<SettingsComponentProps> = ({ settings, onChange, onSave, isSaving }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">General Settings</h2>
        <button onClick={onSave} className="btn-primary flex items-center gap-2" disabled={isSaving}>
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">App Name</label>
          <input
            type="text"
            value={settings.appName}
            onChange={(e) => onChange({ ...settings, appName: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Tagline</label>
          <input
            type="text"
            value={settings.tagline}
            onChange={(e) => onChange({ ...settings, tagline: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Default Language</label>
          <select
            value={settings.defaultLanguage}
            onChange={(e) => onChange({ ...settings, defaultLanguage: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="hi">Hindi</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Time Zone</label>
          <select
            value={settings.timeZone}
            onChange={(e) => onChange({ ...settings, timeZone: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Asia/Kolkata">India</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Date Format</label>
          <select
            value={settings.dateFormat}
            onChange={(e) => onChange({ ...settings, dateFormat: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Currency</label>
          <select
            value={settings.currency}
            onChange={(e) => onChange({ ...settings, currency: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="INR">INR (₹)</option>
          </select>
        </div>
      </div>
    </div>
  )
}

const UserDefaultsSettings: React.FC<SettingsComponentProps> = ({ settings, onChange, onSave, isSaving }) => {
  const { data: programsData } = useQuery({
    queryKey: ['programs', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('programs'),
  })

  const programs = programsData?.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">User Defaults</h2>
        <button onClick={onSave} className="btn-primary flex items-center gap-2" disabled={isSaving}>
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Default Program</label>
          <select
            value={settings.defaultProgram}
            onChange={(e) => onChange({ ...settings, defaultProgram: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select program...</option>
            {programs.map((program: any) => (
              <option key={program.id} value={program.id}>{program.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Default Reminder Time</label>
          <input
            type="time"
            value={settings.defaultReminderTime}
            onChange={(e) => onChange({ ...settings, defaultReminderTime: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.emailVerificationRequired}
              onChange={(e) => onChange({ ...settings, emailVerificationRequired: e.target.checked })}
              className="rounded border-neutral-300"
            />
            <span className="text-sm text-neutral-700">Email Verification Required</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.phoneVerificationRequired}
              onChange={(e) => onChange({ ...settings, phoneVerificationRequired: e.target.checked })}
              className="rounded border-neutral-300"
            />
            <span className="text-sm text-neutral-700">Phone Verification Required</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Minimum Age</label>
          <input
            type="number"
            value={settings.minimumAge}
            onChange={(e) => onChange({ ...settings, minimumAge: Number(e.target.value) })}
            min={13}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  )
}

const ContentSettings: React.FC<SettingsComponentProps> = ({ settings, onChange, onSave, isSaving }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Content Settings</h2>
        <button onClick={onSave} className="btn-primary flex items-center gap-2" disabled={isSaving}>
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
      <div className="space-y-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.articleOfTheDayEnabled}
            onChange={(e) => onChange({ ...settings, articleOfTheDayEnabled: e.target.checked })}
            className="rounded border-neutral-300"
          />
          <span className="text-sm text-neutral-700">Article of the Day Enabled</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.randomQuoteEnabled}
            onChange={(e) => onChange({ ...settings, randomQuoteEnabled: e.target.checked })}
            className="rounded border-neutral-300"
          />
          <span className="text-sm text-neutral-700">Random Quote Enabled</span>
        </label>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Quote Rotation Frequency</label>
          <select
            value={settings.quoteRotationFrequency}
            onChange={(e) => onChange({ ...settings, quoteRotationFrequency: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.contentApprovalRequired}
            onChange={(e) => onChange({ ...settings, contentApprovalRequired: e.target.checked })}
            className="rounded border-neutral-300"
          />
          <span className="text-sm text-neutral-700">Content Approval Required (new content goes to draft)</span>
        </label>
      </div>
    </div>
  )
}

const NotificationSettings: React.FC<SettingsComponentProps> = ({ settings, onChange, onSave, isSaving }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Notification Settings</h2>
        <button onClick={onSave} className="btn-primary flex items-center gap-2" disabled={isSaving}>
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
      <div className="space-y-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.emailNotificationsEnabled}
            onChange={(e) => onChange({ ...settings, emailNotificationsEnabled: e.target.checked })}
            className="rounded border-neutral-300"
          />
          <span className="text-sm text-neutral-700">Email Notifications Enabled</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.smsNotificationsEnabled}
            onChange={(e) => onChange({ ...settings, smsNotificationsEnabled: e.target.checked })}
            className="rounded border-neutral-300"
          />
          <span className="text-sm text-neutral-700">SMS Notifications Enabled</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.pushNotificationsEnabled}
            onChange={(e) => onChange({ ...settings, pushNotificationsEnabled: e.target.checked })}
            className="rounded border-neutral-300"
          />
          <span className="text-sm text-neutral-700">Push Notifications Enabled</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.dailyReminderDefault}
            onChange={(e) => onChange({ ...settings, dailyReminderDefault: e.target.checked })}
            className="rounded border-neutral-300"
          />
          <span className="text-sm text-neutral-700">Daily Reminder Default</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.achievementNotifications}
            onChange={(e) => onChange({ ...settings, achievementNotifications: e.target.checked })}
            className="rounded border-neutral-300"
          />
          <span className="text-sm text-neutral-700">Achievement Notifications</span>
        </label>
      </div>
    </div>
  )
}

const SecuritySettings: React.FC<SettingsComponentProps> = ({ settings, onChange, onSave, isSaving }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Security Settings</h2>
        <button onClick={onSave} className="btn-primary flex items-center gap-2" disabled={isSaving}>
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Session Timeout (minutes)</label>
          <input
            type="number"
            value={settings.sessionTimeout}
            onChange={(e) => onChange({ ...settings, sessionTimeout: Number(e.target.value) })}
            min={5}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="border-t border-neutral-200 pt-4">
          <h3 className="font-medium mb-3">Password Requirements</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Minimum Length</label>
              <input
                type="number"
                value={settings.passwordMinLength}
                onChange={(e) => onChange({ ...settings, passwordMinLength: Number(e.target.value) })}
                min={6}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.passwordRequireUppercase}
                onChange={(e) => onChange({ ...settings, passwordRequireUppercase: e.target.checked })}
                className="rounded border-neutral-300"
              />
              <span className="text-sm text-neutral-700">Require Uppercase</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.passwordRequireNumber}
                onChange={(e) => onChange({ ...settings, passwordRequireNumber: e.target.checked })}
                className="rounded border-neutral-300"
              />
              <span className="text-sm text-neutral-700">Require Number</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.passwordRequireSpecialChar}
                onChange={(e) => onChange({ ...settings, passwordRequireSpecialChar: e.target.checked })}
                className="rounded border-neutral-300"
              />
              <span className="text-sm text-neutral-700">Require Special Character</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Password Expiry (days, 0 = never)</label>
              <input
                type="number"
                value={settings.passwordExpiry}
                onChange={(e) => onChange({ ...settings, passwordExpiry: Number(e.target.value) })}
                min={0}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
        <div className="border-t border-neutral-200 pt-4 space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.twoFactorAuth}
              onChange={(e) => onChange({ ...settings, twoFactorAuth: e.target.checked })}
              className="rounded border-neutral-300"
            />
            <span className="text-sm text-neutral-700">Two-Factor Authentication</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">IP Whitelist (one IP per line)</label>
            <textarea
              value={settings.ipWhitelist}
              onChange={(e) => onChange({ ...settings, ipWhitelist: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              placeholder="192.168.1.1&#10;10.0.0.1"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const IntegrationsSettings: React.FC<SettingsComponentProps> = ({ settings, onChange, onSave, isSaving }) => {
  const handleTestEmail = () => {
    alert('Test email would be sent (integration not implemented)')
  }

  const handleTestSMS = () => {
    alert('Test SMS would be sent (integration not implemented)')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Integrations</h2>
        <button onClick={onSave} className="btn-primary flex items-center gap-2" disabled={isSaving}>
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Email Service */}
      <div className="border-b border-neutral-200 pb-6">
        <h3 className="font-medium mb-4">Email Service</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Provider</label>
            <select
              value={settings.emailProvider}
              onChange={(e) => onChange({ ...settings, emailProvider: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="sendgrid">SendGrid</option>
              <option value="mailgun">Mailgun</option>
              <option value="aws_ses">AWS SES</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">API Key</label>
            <input
              type="password"
              value={settings.emailApiKey}
              onChange={(e) => onChange({ ...settings, emailApiKey: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              placeholder="Enter API key..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">From Email</label>
              <input
                type="email"
                value={settings.emailFrom}
                onChange={(e) => onChange({ ...settings, emailFrom: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">From Name</label>
              <input
                type="text"
                value={settings.emailFromName}
                onChange={(e) => onChange({ ...settings, emailFromName: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <button onClick={handleTestEmail} className="btn-secondary text-sm">
            Test Email
          </button>
        </div>
      </div>

      {/* SMS Service */}
      <div className="border-b border-neutral-200 pb-6">
        <h3 className="font-medium mb-4">SMS Service</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Provider</label>
            <select
              value={settings.smsProvider}
              onChange={(e) => onChange({ ...settings, smsProvider: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="twilio">Twilio</option>
              <option value="nexmo">Nexmo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">API Key</label>
            <input
              type="password"
              value={settings.smsApiKey}
              onChange={(e) => onChange({ ...settings, smsApiKey: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              placeholder="Enter API key..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">From Number</label>
            <input
              type="text"
              value={settings.smsFromNumber}
              onChange={(e) => onChange({ ...settings, smsFromNumber: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="+1234567890"
            />
          </div>
          <button onClick={handleTestSMS} className="btn-secondary text-sm">
            Test SMS
          </button>
        </div>
      </div>

      {/* Analytics */}
      <div>
        <h3 className="font-medium mb-4">Analytics</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Google Analytics ID</label>
            <input
              type="text"
              value={settings.googleAnalyticsId}
              onChange={(e) => onChange({ ...settings, googleAnalyticsId: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="UA-XXXXXXXXX-X"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Facebook Pixel ID</label>
            <input
              type="text"
              value={settings.facebookPixelId}
              onChange={(e) => onChange({ ...settings, facebookPixelId: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter Pixel ID..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const DataPrivacySettings: React.FC<SettingsComponentProps> = ({ settings, onChange, onSave, isSaving }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Data & Privacy</h2>
        <button onClick={onSave} className="btn-primary flex items-center gap-2" disabled={isSaving}>
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
      <div className="space-y-4">
        <div className="border-b border-neutral-200 pb-4">
          <h3 className="font-medium mb-3">Data Retention Policy</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                User data kept for (days after deletion)
              </label>
              <input
                type="number"
                value={settings.dataRetentionDays}
                onChange={(e) => onChange({ ...settings, dataRetentionDays: Number(e.target.value) })}
                min={0}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Anonymize after (days)
              </label>
              <input
                type="number"
                value={settings.anonymizeAfterDays}
                onChange={(e) => onChange({ ...settings, anonymizeAfterDays: Number(e.target.value) })}
                min={0}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
        <div className="border-b border-neutral-200 pb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.gdprCompliance}
              onChange={(e) => onChange({ ...settings, gdprCompliance: e.target.checked })}
              className="rounded border-neutral-300"
            />
            <span className="text-sm text-neutral-700">GDPR Compliance</span>
          </label>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Terms of Service URL</label>
            <input
              type="url"
              value={settings.termsOfServiceUrl}
              onChange={(e) => onChange({ ...settings, termsOfServiceUrl: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Privacy Policy URL</label>
            <input
              type="url"
              value={settings.privacyPolicyUrl}
              onChange={(e) => onChange({ ...settings, privacyPolicyUrl: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Cookie Policy URL</label>
            <input
              type="url"
              value={settings.cookiePolicyUrl}
              onChange={(e) => onChange({ ...settings, cookiePolicyUrl: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Data Export Format</label>
            <select
              value={settings.dataExportFormat}
              onChange={(e) => onChange({ ...settings, dataExportFormat: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
