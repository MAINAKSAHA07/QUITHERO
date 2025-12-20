import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Lock,
  Globe,
  Calendar,
  Download,
  HelpCircle,
  MessageCircle,
  Star,
  Share2,
  LogOut,
  Edit,
  CheckCircle,
  Save,
  X,
} from 'lucide-react'
import TopNavigation from '../components/TopNavigation'
import BottomNavigation from '../components/BottomNavigation'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'
import GlassInput from '../components/GlassInput'
import TranslatedText from '../components/TranslatedText'
import { useApp } from '../context/AppContext'
import { authHelpers } from '../lib/pocketbase'
import { analyticsService } from '../services/analytics.service'
import SupportTicketModal from '../components/SupportTicketModal'

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'zh', name: '中文' },
]

export default function Profile() {
  const navigate = useNavigate()
  const { user, userProfile, progressStats, currentSession, setIsAuthenticated, setUser, updateUserProfile, fetchUserProfile, language } = useApp()
  // const { updateProfile } = useProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [notifications, setNotifications] = useState({
    daily: userProfile?.enable_reminders ?? true,
    craving: true,
    achievements: true,
    community: false,
  })
  const [reminderTime, setReminderTime] = useState(userProfile?.daily_reminder_time || '09:00')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile()
      analyticsService.trackPageView('profile', user.id)
    }
  }, [user?.id])

  useEffect(() => {
    if (userProfile) {
      setNotifications({
        daily: userProfile.enable_reminders ?? true,
        craving: true,
        achievements: true,
        community: false,
      })
      setReminderTime(userProfile.daily_reminder_time || '09:00')
      setEditForm({
        name: user?.name || '',
        email: user?.email || '',
      })
    }
  }, [userProfile, user])

  const handleSaveSettings = async () => {
    if (!user?.id) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await updateUserProfile({
        enable_reminders: notifications.daily,
        daily_reminder_time: notifications.daily ? reminderTime : undefined,
      })
      setSuccess('Settings saved successfully!')
      await analyticsService.trackEvent('profile_settings_updated', { settings: 'notifications' }, user.id)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save settings')
      setTimeout(() => setError(''), 5000)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user?.id) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Update auth user (name, email)
      const pb = (await import('../lib/pocketbase')).pb
      await pb.collection('users').update(user.id, {
        name: editForm.name,
        email: editForm.email,
      })

      // Update user profile if needed
      if (userProfile) {
        await updateUserProfile({})
      }

      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      await analyticsService.trackEvent('profile_updated', {}, user.id)
      // Refresh user data
      window.location.reload() // Simple refresh to get updated user data
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
      setTimeout(() => setError(''), 5000)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setShowPasswordModal(true)
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setError('')
  }

  const handlePasswordChangeSubmit = async () => {
    if (!user?.id) return

    // Validation
    if (!passwordForm.currentPassword) {
      setError('Current password is required')
      return
    }
    if (!passwordForm.newPassword) {
      setError('New password is required')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    setChangingPassword(true)
    setError('')
    setSuccess('')

    try {
      const pb = (await import('../lib/pocketbase')).pb
      
      // First verify current password by attempting to re-authenticate
      try {
        await pb.collection('users').authWithPassword(user.email || '', passwordForm.currentPassword)
      } catch (authError: any) {
        setError('Current password is incorrect')
        setChangingPassword(false)
        return
      }

      // Update password - PocketBase requires oldPassword for password changes
      await pb.collection('users').update(user.id, {
        oldPassword: passwordForm.currentPassword,
        password: passwordForm.newPassword,
        passwordConfirm: passwordForm.confirmPassword,
      })

      // Re-authenticate with new password to refresh session
      await pb.collection('users').authWithPassword(user.email || '', passwordForm.newPassword)
      
      // Update user context
      const updatedUser = pb.authStore.model
      if (updatedUser) {
        setUser(updatedUser)
      }

      setSuccess('Password changed successfully!')
      setShowPasswordModal(false)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      await analyticsService.trackEvent('password_changed', {}, user.id)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Password change error:', err)
      setError(err.message || 'Failed to change password. Please try again.')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDownloadCertificate = () => {
    if (!userProfile?.quit_date) {
      alert('Please set your quit date first to download a certificate.')
      return
    }

    // Create a simple certificate (can be enhanced with PDF generation later)
    const daysSmokeFree = progressStats?.days_smoke_free || 0
    const certificateText = `
╔═══════════════════════════════════════════════════════════╗
║                                                             ║
║                    CERTIFICATE OF ACHIEVEMENT               ║
║                                                             ║
║  This certifies that                                        ║
║                                                             ║
║  ${(user?.name || 'User').toUpperCase().padEnd(50)} ║
║                                                             ║
║  has successfully completed                                 ║
║                                                             ║
║  ${daysSmokeFree} DAYS SMOKE-FREE                            ║
║                                                             ║
║  Quit Date: ${new Date(userProfile.quit_date).toLocaleDateString()}                    ║
║                                                             ║
║  Keep up the amazing work!                                  ║
║                                                             ║
║  Quit Hero                                                  ║
║  ${new Date().toLocaleDateString()}                          ║
║                                                             ║
╚═══════════════════════════════════════════════════════════╝
    `.trim()

    // Create a blob and download
    const blob = new Blob([certificateText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quit-hero-certificate-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    analyticsService.trackEvent('certificate_downloaded', { daysSmokeFree }, user?.id)
  }

  const handleFAQs = () => {
    // Navigate to FAQs or show modal
    const faqs = [
      {
        q: 'How do I track my progress?',
        a: 'Your progress is automatically tracked as you complete sessions. Check the Home and Progress pages to see your stats.',
      },
      {
        q: 'What if I have a slip?',
        a: 'Slips are part of the journey. Log them in the app and continue with your program. Every day smoke-free counts!',
      },
      {
        q: 'How do I change my quit date?',
        a: 'Contact support to change your quit date, as it affects your progress calculations.',
      },
      {
        q: 'Can I reset my progress?',
        a: 'Contact support if you need to reset your progress. This action cannot be undone.',
      },
    ]

    const faqText = faqs.map((faq, i) => `${i + 1}. ${faq.q}\n   ${faq.a}`).join('\n\n')
    alert(`Frequently Asked Questions:\n\n${faqText}\n\nFor more help, contact support.`)
    analyticsService.trackEvent('faqs_viewed', {}, user?.id)
  }

  const handleContactSupport = () => {
    setShowSupportModal(true)
    analyticsService.trackEvent('contact_support_clicked', {}, user?.id)
  }

  const handleRateApp = () => {
    // For web app, show a thank you message
    // For mobile apps, this would open the app store
    alert('Thank you for using Quit Hero! 🌟\n\nIf you\'re enjoying the app, please consider leaving a review on your app store.\n\nYour feedback helps us improve!')
    analyticsService.trackEvent('rate_app_clicked', {}, user?.id)
  }

  const handleShareApp = async () => {
    const shareData = {
      title: 'Quit Hero - Your Journey to Freedom',
      text: 'I\'m using Quit Hero to quit smoking. Join me on this journey!',
      url: window.location.origin,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        analyticsService.trackEvent('app_shared', { method: 'native' }, user?.id)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
        alert('App link copied to clipboard! Share it with your friends.')
        analyticsService.trackEvent('app_shared', { method: 'clipboard' }, user?.id)
      }
    } catch (err) {
      // User cancelled or error occurred
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share error:', err)
      }
    }
  }

  const handleTerms = () => {
    alert('Terms of Service\n\nBy using Quit Hero, you agree to:\n\n1. Use the app responsibly\n2. Provide accurate information\n3. Respect the community guidelines\n4. Not misuse the app or its features\n\nFor the full terms, please contact support.')
    analyticsService.trackEvent('terms_viewed', {}, user?.id)
  }

  const handlePrivacy = () => {
    alert('Privacy Policy\n\nQuit Hero respects your privacy:\n\n1. We collect only necessary data for app functionality\n2. Your data is encrypted and secure\n3. We do not share your personal information with third parties\n4. You can delete your account and data at any time\n\nFor the full privacy policy, please contact support.')
    analyticsService.trackEvent('privacy_viewed', {}, user?.id)
  }

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      if (user?.id) {
        await analyticsService.trackEvent('logout', {}, user.id)
      }
      authHelpers.logout()
      setIsAuthenticated(false)
      setUser(null)
      navigate('/login')
    }
  }

  // Calculate member since date
  const memberSince = user?.id
    ? new Date().toISOString().split('T')[0] // TODO: Get from user creation date
    : new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen pb-24">
      <TopNavigation left="menu" center="Profile" right="" />

      <div className="max-w-md mx-auto px-4 pt-6 pb-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-6 mb-6 text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full glass-strong border-4 border-brand-primary/20 flex items-center justify-center">
              <User className="w-12 h-12 text-brand-primary" />
            </div>
            {isEditing ? (
              <div className="space-y-4">
                <GlassInput
                  label="Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  icon={<User className="w-4 h-4" />}
                />
                <GlassInput
                  label="Email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  icon={<Mail className="w-4 h-4" />}
                />
                <div className="flex gap-2">
                  <GlassButton
                    onClick={handleSaveProfile}
                    className="flex-1 py-2"
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 inline mr-2" />
                    <TranslatedText text={saving ? 'Saving...' : 'Save'} />
                  </GlassButton>
                  <GlassButton
                    onClick={() => {
                      setIsEditing(false)
                      setEditForm({
                        name: user?.name || '',
                        email: user?.email || '',
                      })
                    }}
                    variant="secondary"
                    className="flex-1 py-2"
                    disabled={saving}
                  >
                    <X className="w-4 h-4 inline mr-2" />
                    <TranslatedText text="Cancel" />
                  </GlassButton>
                </div>
                {error && <p className="text-sm text-error text-center">{error}</p>}
                {success && <p className="text-sm text-success text-center">{success}</p>}
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-text-primary mb-1">{user?.name || 'Guest'}</h2>
                <p className="text-text-primary/70 mb-4">{user?.email || ''}</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="glass-button-secondary px-4 py-2 text-sm"
                >
                  <Edit className="w-4 h-4 inline mr-2" />
                  <TranslatedText text="Edit Profile" />
                </button>
              </>
            )}

            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
              <div>
                <div className="text-lg font-bold text-text-primary">
                  <TranslatedText text="Member since" />
                </div>
                <div className="text-xs text-text-primary/70">
                  {new Date(memberSince).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-text-primary">
                  {progressStats?.days_smoke_free || 0}
                </div>
                <div className="text-xs text-text-primary/70">
                  <TranslatedText text="Days smoke-free" />
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-text-primary">
                  {currentSession ? (currentSession.current_day || 0) : 0}
                </div>
                <div className="text-xs text-text-primary/70">
                  <TranslatedText text="Current day" />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold text-text-primary mb-3">
            <TranslatedText text="Account" />
          </h3>
          <GlassCard className="p-4 mb-6 space-y-3">
            <button className="flex items-center justify-between w-full glass-subtle p-3 rounded-xl">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-brand-primary" />
                <span className="text-text-primary">
                  <TranslatedText text="Email" />
                </span>
              </div>
              <span className="text-text-primary/70 text-sm">{user?.email || ''}</span>
            </button>
            <button
              onClick={handleChangePassword}
              className="flex items-center justify-between w-full glass-subtle p-3 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-brand-primary" />
                <span className="text-text-primary">
                  <TranslatedText text="Change Password" />
                </span>
              </div>
            </button>
            <button
              onClick={() => navigate('/language?from=/profile')}
              className="flex items-center justify-between w-full glass-subtle p-3 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-brand-primary" />
                <span className="text-text-primary">
                  <TranslatedText text="Language" />
                </span>
              </div>
              <span className="text-text-primary/70 text-sm">
                {languages.find(l => l.code === language)?.name || 'English'}
              </span>
            </button>
          </GlassCard>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-text-primary mb-3">
            <TranslatedText text="Notifications" />
          </h3>
          <GlassCard className="p-4 mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-text-primary">
                  <TranslatedText text="Daily reminders" />
                </div>
                <div className="text-xs text-text-primary/70">
                  <TranslatedText text={`Get notified at ${reminderTime} every day`} />
                </div>
              </div>
              <button
                onClick={() => {
                  setNotifications({ ...notifications, daily: !notifications.daily })
                  handleSaveSettings()
                }}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  notifications.daily ? 'bg-brand-primary' : 'bg-text-primary/30'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    notifications.daily ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
            {notifications.daily && (
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => {
                  setReminderTime(e.target.value)
                  handleSaveSettings()
                }}
                className="glass-input w-full"
              />
            )}
            {error && <p className="text-sm text-error text-center mt-2">{error}</p>}
            {success && <p className="text-sm text-success text-center mt-2">{success}</p>}
            <div className="flex items-center justify-between">
              <div className="font-medium text-text-primary">
                <TranslatedText text="Craving alerts" />
              </div>
              <button
                onClick={() =>
                  setNotifications({ ...notifications, craving: !notifications.craving })
                }
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  notifications.craving ? 'bg-brand-primary' : 'bg-text-primary/30'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    notifications.craving ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="font-medium text-text-primary">
                <TranslatedText text="Achievement notifications" />
              </div>
              <button
                onClick={() =>
                  setNotifications({
                    ...notifications,
                    achievements: !notifications.achievements,
                  })
                }
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  notifications.achievements ? 'bg-brand-primary' : 'bg-text-primary/30'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    notifications.achievements ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Program */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-text-primary mb-3">
            <TranslatedText text="Program" />
          </h3>
          <GlassCard className="p-4 mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-brand-primary" />
                <span className="text-text-primary">
                  <TranslatedText text="Current program" />
                </span>
              </div>
              <span className="text-text-primary/70 text-sm">
                <TranslatedText text="10-Day Transformation" />
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-brand-primary" />
                <span className="text-text-primary">
                  <TranslatedText text="Quit date" />
                </span>
              </div>
              <span className="text-text-primary/70 text-sm">
                {userProfile?.quit_date
                  ? new Date(userProfile.quit_date).toLocaleDateString()
                  : <TranslatedText text="Not set" />}
              </span>
            </div>
            <button
              onClick={handleDownloadCertificate}
              className="flex items-center justify-between w-full glass-subtle p-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-brand-primary" />
                <span className="text-text-primary">
                  <TranslatedText text="Download Certificate" />
                </span>
              </div>
            </button>
          </GlassCard>
        </motion.div>

        {/* Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-text-primary mb-3">
            <TranslatedText text="Support" />
          </h3>
          <GlassCard className="p-4 mb-6 space-y-3">
            <button
              onClick={handleFAQs}
              className="flex items-center justify-between w-full glass-subtle p-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-brand-primary" />
                <span className="text-text-primary">
                  <TranslatedText text="FAQs" />
                </span>
              </div>
            </button>
            <button
              onClick={handleContactSupport}
              className="flex items-center justify-between w-full glass-subtle p-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-brand-primary" />
                <span className="text-text-primary">
                  <TranslatedText text="Contact Support" />
                </span>
              </div>
            </button>
            <button
              onClick={handleRateApp}
              className="flex items-center justify-between w-full glass-subtle p-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-brand-primary" />
                <span className="text-text-primary">
                  <TranslatedText text="Rate App" />
                </span>
              </div>
            </button>
            <button
              onClick={handleShareApp}
              className="flex items-center justify-between w-full glass-subtle p-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Share2 className="w-5 h-5 text-brand-primary" />
                <span className="text-text-primary">
                  <TranslatedText text="Share App" />
                </span>
              </div>
            </button>
          </GlassCard>
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard className="p-4 mb-6">
            <div className="text-center text-text-primary/70 text-sm">
              <p className="mb-2">Quit Hero v1.0.0</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleTerms}
                  className="hover:text-brand-primary transition-colors"
                >
                  <TranslatedText text="Terms" />
                </button>
                <button
                  onClick={handlePrivacy}
                  className="hover:text-brand-primary transition-colors"
                >
                  <TranslatedText text="Privacy" />
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GlassButton
            onClick={handleLogout}
            variant="secondary"
            fullWidth
            className="py-4 text-error border-error/50"
          >
            <LogOut className="w-5 h-5 inline mr-2" />
            <TranslatedText text="Logout" />
          </GlassButton>
        </motion.div>
      </div>

      <BottomNavigation />

      {/* Support Ticket Modal */}
      {user?.id && (
        <SupportTicketModal
          isOpen={showSupportModal}
          onClose={() => setShowSupportModal(false)}
          userId={user.id}
        />
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPasswordModal(false)
              setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              })
              setError('')
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <div className="p-6 bg-white rounded-2xl shadow-2xl border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  <TranslatedText text="Change Password" />
                </h3>
                <button
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    })
                    setError('')
                  }}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <TranslatedText text="Current Password" />
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none flex items-center">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 pl-[3.5rem] focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30 focus:outline-none text-gray-900 placeholder:text-gray-400"
                      placeholder="Enter current password"
                    />
                  </div>
                </div>
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <TranslatedText text="New Password" />
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none flex items-center">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 pl-[3.5rem] focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30 focus:outline-none text-gray-900 placeholder:text-gray-400"
                      placeholder="Enter new password"
                    />
                  </div>
                </div>
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <TranslatedText text="Confirm New Password" />
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none flex items-center">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 pl-[3.5rem] focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30 focus:outline-none text-gray-900 placeholder:text-gray-400"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-error text-center">{error}</p>}
                {success && <p className="text-sm text-success text-center">{success}</p>}

                <div className="flex gap-3 pt-2">
                  <GlassButton
                    onClick={handlePasswordChangeSubmit}
                    className="flex-1 py-3"
                    disabled={changingPassword}
                  >
                    <TranslatedText text={changingPassword ? 'Changing...' : 'Change Password'} />
                  </GlassButton>
                  <button
                    onClick={() => {
                      setShowPasswordModal(false)
                      setPasswordForm({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      })
                      setError('')
                    }}
                    disabled={changingPassword}
                    className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TranslatedText text="Cancel" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

