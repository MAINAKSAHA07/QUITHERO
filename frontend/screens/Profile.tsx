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
  Flame,
  Trophy,
  Bell,
  ChevronRight,
  Phone,
} from 'lucide-react'
import BottomNavigation from '../components/BottomNavigation'
import GlassButton from '../components/GlassButton'
import GlassInput from '../components/GlassInput'
import TranslatedText from '../components/TranslatedText'
import AppHeader from '../components/AppHeader'
import { useApp } from '../context/AppContext'
import pb, { authHelpers, mapAuthRecordToAppUser } from '../lib/pocketbase'
import { analyticsService } from '../services/analytics.service'
import SupportTicketModal from '../components/SupportTicketModal'
import Mascot from '../components/Mascot'
import SmonoLogo from '../components/SmonoLogo'
import { getUserTimezone } from '../utils/reminderTime'
import { daysSinceQuitDate } from '../utils/smokeFreeDays'
import { useProgress } from '../hooks/useProgress'

import { getLanguageDisplayName } from '../constants/languages'

export default function Profile() {
  const navigate = useNavigate()
  const { user, userProfile, progressStats, currentSession, setIsAuthenticated, setUser, updateUserProfile, fetchUserProfile, language } = useApp()
  const { calculation, refresh: refreshProgress } = useProgress()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: userProfile?.phone || '',
  })
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [editingPhone, setEditingPhone] = useState(false)
  const [phoneDraft, setPhoneDraft] = useState(userProfile?.phone || '')
  const [savingPhone, setSavingPhone] = useState(false)
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
      refreshProgress()
      analyticsService.trackPageView('profile', user.id)
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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
        phone: userProfile.phone || '',
      })
      if (!editingPhone) {
        setPhoneDraft(userProfile.phone || '')
      }
    }
  }, [userProfile, user, editingPhone])

  const handleSavePhone = async () => {
    if (!user?.id) return
    setSavingPhone(true)
    setError('')
    try {
      const phone = phoneDraft.trim()
      const { profileService } = await import('../services/profile.service')
      const result = await profileService.upsert(user.id, { phone })
      if (!result.success) throw new Error(result.error || 'Failed to save phone number')
      await fetchUserProfile()
      setEditingPhone(false)
      setSuccess(phone ? 'Phone number saved' : 'Phone number removed')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save phone number')
      setTimeout(() => setError(''), 5000)
    } finally {
      setSavingPhone(false)
    }
  }

  const handleSaveSettings = async (overrides?: {
    daily?: boolean
    reminderTime?: string
  }) => {
    if (!user?.id) return

    const daily = overrides?.daily ?? notifications.daily
    const time = overrides?.reminderTime ?? reminderTime

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await updateUserProfile({
        enable_reminders: daily,
        daily_reminder_time: daily ? time : undefined,
        timezone: getUserTimezone(),
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

      const { profileService } = await import('../services/profile.service')
      const result = await profileService.upsert(user.id, { phone: editForm.phone.trim() })
      if (!result.success) throw new Error(result.error || 'Failed to update profile')

      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      await analyticsService.trackEvent('profile_updated', {}, user.id)
      await fetchUserProfile()
      if (pb.authStore.model) {
        const mapped = mapAuthRecordToAppUser(pb.authStore.model as Record<string, unknown>)
        if (mapped) setUser(mapped)
      }
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
        const mapped = mapAuthRecordToAppUser(updatedUser as Record<string, unknown>)
        if (mapped) setUser(mapped)
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
║  smono                                                      ║
║  ${new Date().toLocaleDateString()}                          ║
║                                                             ║
╚═══════════════════════════════════════════════════════════╝
    `.trim()

    // Create a blob and download
    const blob = new Blob([certificateText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `smono-certificate-${new Date().toISOString().split('T')[0]}.txt`
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
    alert('Thank you for using smono! 🌟\n\nIf you\'re enjoying the app, please consider leaving a review on your app store.\n\nYour feedback helps us improve!')
    analyticsService.trackEvent('rate_app_clicked', {}, user?.id)
  }

  const handleShareApp = async () => {
    const shareData = {
      title: 'smono - Your Journey to Freedom',
      text: 'I\'m using smono to quit smoking. Join me on this journey!',
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
    navigate('/terms')
    analyticsService.trackEvent('terms_viewed', {}, user?.id)
  }

  const handlePrivacy = () => {
    navigate('/privacy')
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

  const memberSinceRaw =
    user?.created ||
    (pb.authStore.model as { created?: string } | null)?.created
  const memberSince = memberSinceRaw ? new Date(memberSinceRaw) : null

  const daysSmokeFree =
    calculation?.days_smoke_free ??
    progressStats?.days_smoke_free ??
    daysSinceQuitDate(userProfile?.quit_date) ??
    0
  const currentDay = currentSession?.current_day || 0
  const displayName = userProfile?.onboarding_name?.trim() || user?.name || 'Guest'
  const langLabel = getLanguageDisplayName(language)

  return (
    <div className="h-screen max-h-[100dvh] w-full max-w-md mx-auto flex flex-col overflow-hidden relative bg-[#F4FBFF]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48"
        style={{
          background: 'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(139, 205, 232, 0.35), transparent 70%)',
        }}
        aria-hidden
      />

      <div className="flex-1 overflow-y-auto px-4 safe-area-top scrollbar-thin pb-28 relative z-10">
        <AppHeader title="Profile" />

        {/* Profile hero card */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl bg-white p-6 mb-5 text-center shadow-[0_8px_30px_rgba(63,141,210,0.08)] border border-white"
        >
          <label className="relative w-24 h-24 mx-auto mb-3 rounded-full bg-[#E8F4FC] border-4 border-[#3F8DD2]/20 flex items-center justify-center cursor-pointer group overflow-hidden">
            {user?.avatar ? (
              <img
                src={`${pb.baseUrl}/api/files/users/${user.id}/${user.avatar}`}
                alt=""
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <Mascot size="md" />
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit className="w-5 h-5 text-white" />
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file || !user?.id) return
                try {
                  const formData = new FormData()
                  formData.append('avatar', file)
                  await pb.collection('users').update(user.id, formData)
                  fetchUserProfile()
                } catch { /* silent */ }
              }}
            />
          </label>

          {isEditing ? (
            <div className="space-y-3 text-left">
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
              <GlassInput
                label="Phone"
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                icon={<Phone className="w-4 h-4" />}
              />
              <div className="flex gap-2">
                <GlassButton onClick={handleSaveProfile} className="flex-1 py-2.5" disabled={saving}>
                  <Save className="w-4 h-4 inline mr-2" />
                  <TranslatedText text={saving ? 'Saving...' : 'Save'} />
                </GlassButton>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setEditForm({
                      name: user?.name || '',
                      email: user?.email || '',
                      phone: userProfile?.phone || '',
                    })
                  }}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl border border-[#0E2538]/15 text-sm font-semibold text-[#0E2538]/70"
                >
                  <TranslatedText text="Cancel" />
                </button>
              </div>
              {error && <p className="text-sm text-error text-center">{error}</p>}
              {success && <p className="text-sm text-success text-center">{success}</p>}
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-[#0E2538] mb-0.5">{displayName}</h2>
              <p className="text-sm text-[#0E2538]/50 mb-3">{user?.email || ''}</p>
              <SmonoLogo size="sm" className="flex justify-center mb-4" />
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-[#3F8DD2] border border-[#3F8DD2]/35 bg-[#E8F4FC]/60 hover:bg-[#E8F4FC] transition-colors"
              >
                <Edit className="w-4 h-4" />
                <TranslatedText text="Edit Profile" />
              </button>
            </>
          )}

          <div className="grid grid-cols-3 gap-2 text-center mt-6 pt-5 border-t border-[#0E2538]/08">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-[#E8F4FC] flex items-center justify-center">
                <Calendar className="w-4 h-4 text-[#3F8DD2]" />
              </div>
              <div className="text-base font-bold text-[#0E2538]">
                {memberSince
                  ? memberSince.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  : '—'}
              </div>
              <div className="text-[10px] font-medium text-[#0E2538]/45">
                <TranslatedText text="Joined" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-[#FFF1E6] flex items-center justify-center">
                <Flame className="w-4 h-4 text-[#E8894A]" />
              </div>
              <div className="text-base font-bold text-[#0E2538]">{daysSmokeFree}</div>
              <div className="text-[10px] font-medium text-[#0E2538]/45">
                <TranslatedText text="Days smoke-free" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-[#EAF6F1] flex items-center justify-center">
                <Trophy className="w-4 h-4 text-[#6EA48F]" />
              </div>
              <div className="text-base font-bold text-[#0E2538]">{currentDay}</div>
              <div className="text-[10px] font-medium text-[#0E2538]/45">
                <TranslatedText text="Current day" />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Account */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="mb-5"
        >
          <h3 className="text-sm font-bold text-[#0E2538] mb-3 px-0.5">
            <TranslatedText text="Account" />
          </h3>
          <div className="rounded-3xl bg-white shadow-[0_4px_16px_rgba(63,141,210,0.06)] border border-white overflow-hidden divide-y divide-[#0E2538]/06">
            <AccountRow
              icon={Mail}
              label="Email"
              value={user?.email || '—'}
            />
            {editingPhone ? (
              <div className="px-4 py-3.5 space-y-3">
                <div className="flex items-center gap-3">
                  <IconBubble icon={Phone} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0E2538] mb-1.5">
                      <TranslatedText text="Phone" />
                    </p>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={phoneDraft}
                      onChange={(e) => setPhoneDraft(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-[#0E2538]/10 bg-[#F4FBFF] px-3 py-2 text-sm text-[#0E2538]"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="flex gap-2 pl-12">
                  <button
                    type="button"
                    onClick={handleSavePhone}
                    disabled={savingPhone}
                    className="flex-1 py-2 rounded-xl bg-[#3F8DD2] text-white text-sm font-semibold disabled:opacity-50"
                  >
                    <TranslatedText text={savingPhone ? 'Saving...' : 'Save'} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPhone(false)
                      setPhoneDraft(userProfile?.phone || '')
                    }}
                    disabled={savingPhone}
                    className="flex-1 py-2 rounded-xl border border-[#0E2538]/15 text-sm font-semibold text-[#0E2538]/70"
                  >
                    <TranslatedText text="Cancel" />
                  </button>
                </div>
              </div>
            ) : (
              <AccountRow
                icon={Phone}
                label="Phone"
                value={userProfile?.phone?.trim() || 'Add phone number'}
                muted={!userProfile?.phone?.trim()}
                onClick={() => {
                  setPhoneDraft(userProfile?.phone || '')
                  setEditingPhone(true)
                }}
              />
            )}
            <AccountRow
              icon={Globe}
              label="Language"
              value={langLabel}
              onClick={() => navigate('/language?from=/profile')}
            />
            <AccountRow
              icon={Bell}
              label="Notifications"
              value={notifications.daily ? 'On' : 'Off'}
              onClick={() => {
                document.getElementById('profile-notifications')?.scrollIntoView({ behavior: 'smooth' })
              }}
            />
            <AccountRow
              icon={Lock}
              label="Change Password"
              onClick={handleChangePassword}
            />
          </div>
        </motion.section>

        {/* Notifications */}
        <motion.section
          id="profile-notifications"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="mb-5"
        >
          <h3 className="text-sm font-bold text-[#0E2538] mb-3 px-0.5">
            <TranslatedText text="Notifications" />
          </h3>
          <div className="rounded-3xl bg-white p-4 shadow-[0_4px_16px_rgba(63,141,210,0.06)] border border-white space-y-4">
            <ToggleRow
              title="Daily reminders"
              subtitle={`Get notified at ${reminderTime} every day`}
              on={notifications.daily}
              onToggle={async () => {
                const enabling = !notifications.daily
                if (enabling) {
                  const { enablePushNotifications } = await import('../utils/pushNotifications')
                  const result = await enablePushNotifications()
                  if (!result.ok) {
                    setError(result.error || 'Enable notifications in your browser settings to use daily reminders.')
                    return
                  }
                }
                setNotifications({ ...notifications, daily: enabling })
                handleSaveSettings({ daily: enabling })
              }}
            />
            {notifications.daily && (
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => {
                  const next = e.target.value
                  setReminderTime(next)
                  handleSaveSettings({ reminderTime: next })
                }}
                className="w-full rounded-xl border border-[#0E2538]/10 bg-[#F4FBFF] px-3 py-2.5 text-sm text-[#0E2538]"
              />
            )}
            {error && <p className="text-sm text-error text-center">{error}</p>}
            {success && <p className="text-sm text-success text-center">{success}</p>}
            <ToggleRow
              title="Craving alerts"
              on={notifications.craving}
              onToggle={() => setNotifications({ ...notifications, craving: !notifications.craving })}
            />
            <ToggleRow
              title="Achievement notifications"
              on={notifications.achievements}
              onToggle={() =>
                setNotifications({ ...notifications, achievements: !notifications.achievements })
              }
            />
          </div>
        </motion.section>

        {/* Program */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="mb-5"
        >
          <h3 className="text-sm font-bold text-[#0E2538] mb-3 px-0.5">
            <TranslatedText text="Program" />
          </h3>
          <div className="rounded-3xl bg-white p-4 shadow-[0_4px_16px_rgba(63,141,210,0.06)] border border-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconBubble icon={Calendar} />
                <span className="text-sm font-medium text-[#0E2538]">
                  <TranslatedText text="Current program" />
                </span>
              </div>
              <span className="text-sm text-[#0E2538]/50">30-Day Program</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconBubble icon={CheckCircle} />
                <span className="text-sm font-medium text-[#0E2538]">
                  <TranslatedText text="Quit date" />
                </span>
              </div>
              <input
                type="date"
                value={userProfile?.quit_date ? String(userProfile.quit_date).slice(0, 10) : ''}
                onChange={async (e) => {
                  if (!user?.id || !e.target.value) return
                  try {
                    const { profileService } = await import('../services/profile.service')
                    await profileService.upsert(user.id, { quit_date: e.target.value })
                    fetchUserProfile()
                    refreshProgress()
                  } catch { /* silent */ }
                }}
                className="text-sm text-[#0E2538]/60 bg-transparent border-none outline-none cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconBubble icon={Globe} />
                <span className="text-sm font-medium text-[#0E2538]">
                  <TranslatedText text="Country" />
                </span>
              </div>
              <select
                value={userProfile?.country || ''}
                onChange={async (e) => {
                  if (!user?.id) return
                  try {
                    const { profileService } = await import('../services/profile.service')
                    await profileService.upsert(user.id, { country: e.target.value })
                    fetchUserProfile()
                  } catch { /* silent */ }
                }}
                className="text-sm text-[#0E2538]/60 bg-transparent border-none outline-none cursor-pointer"
              >
                <option value="">Select</option>
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="JP">Japan</option>
                <option value="BR">Brazil</option>
                <option value="AE">UAE</option>
                <option value="SG">Singapore</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleDownloadCertificate}
              className="flex items-center justify-between w-full py-2.5 rounded-xl hover:bg-[#F4FBFF] transition-colors"
            >
              <div className="flex items-center gap-3">
                <IconBubble icon={Download} />
                <span className="text-sm font-medium text-[#0E2538]">
                  <TranslatedText text="Download Certificate" />
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#0E2538]/30" />
            </button>
          </div>
        </motion.section>

        {/* Support */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="mb-5"
        >
          <h3 className="text-sm font-bold text-[#0E2538] mb-3 px-0.5">
            <TranslatedText text="Support" />
          </h3>
          <div className="rounded-3xl bg-white shadow-[0_4px_16px_rgba(63,141,210,0.06)] border border-white overflow-hidden divide-y divide-[#0E2538]/06">
            <AccountRow icon={HelpCircle} label="FAQs" onClick={handleFAQs} />
            <AccountRow icon={MessageCircle} label="Contact Support" onClick={handleContactSupport} />
            <AccountRow icon={Star} label="Rate App" onClick={handleRateApp} />
            <AccountRow icon={Share2} label="Share App" onClick={handleShareApp} />
          </div>
        </motion.section>

        <div className="text-center text-[#0E2538]/40 text-xs mb-4">
          <p className="mb-2">smono v1.0.0</p>
          <div className="flex justify-center gap-4">
            <button type="button" onClick={handleTerms} className="hover:text-[#3F8DD2] transition-colors">
              <TranslatedText text="Terms" />
            </button>
            <button type="button" onClick={handlePrivacy} className="hover:text-[#3F8DD2] transition-colors">
              <TranslatedText text="Privacy" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl border border-red-200 bg-white text-red-500 font-semibold text-sm mb-2 active:scale-[0.98] transition-transform"
        >
          <LogOut className="w-4 h-4 inline mr-2" />
          <TranslatedText text="Logout" />
        </button>
        <button
          type="button"
          onClick={async () => {
            if (!user?.id) return
            const confirmed = window.confirm(
              'Are you sure you want to delete your account? This action is permanent and cannot be undone.'
            )
            if (!confirmed) return
            try {
              await pb.collection('users').delete(user.id)
              handleLogout()
            } catch {
              alert('Failed to delete account. Please contact support.')
            }
          }}
          className="w-full py-3 text-sm text-[#0E2538]/40 hover:text-red-500 transition-colors mb-2"
        >
          Delete Account
        </button>
      </div>

      <BottomNavigation />

      {user?.id && (
        <SupportTicketModal
          isOpen={showSupportModal}
          onClose={() => setShowSupportModal(false)}
          userId={user.id}
        />
      )}

      {showPasswordModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPasswordModal(false)
              setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
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
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    setError('')
                  }}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              <div className="space-y-4">
                {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field) => (
                  <div key={field} className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <TranslatedText
                        text={
                          field === 'currentPassword'
                            ? 'Current Password'
                            : field === 'newPassword'
                              ? 'New Password'
                              : 'Confirm New Password'
                        }
                      />
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none flex items-center">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        value={passwordForm[field]}
                        onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 pl-[3.5rem] focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30 focus:outline-none text-gray-900 placeholder:text-gray-400"
                        placeholder={
                          field === 'currentPassword'
                            ? 'Enter current password'
                            : field === 'newPassword'
                              ? 'Enter new password'
                              : 'Confirm new password'
                        }
                      />
                    </div>
                  </div>
                ))}

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
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false)
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                      setError('')
                    }}
                    disabled={changingPassword}
                    className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
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

function IconBubble({ icon: Icon }: { icon: typeof Mail }) {
  return (
    <div className="w-9 h-9 rounded-full bg-[#E8F4FC] flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-[#3F8DD2]" strokeWidth={2.25} />
    </div>
  )
}

function AccountRow({
  icon: Icon,
  label,
  value,
  onClick,
  muted,
}: {
  icon: typeof Mail
  label: string
  value?: string
  onClick?: () => void
  muted?: boolean
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3.5 text-left ${onClick ? 'hover:bg-[#F4FBFF] active:bg-[#E8F4FC]/50 transition-colors' : ''}`}
    >
      <IconBubble icon={Icon} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0E2538]">
          <TranslatedText text={label} />
        </p>
        {value != null && (
          <p className={`text-xs truncate ${muted ? 'text-[#0E2538]/35' : 'text-[#0E2538]/50'}`}>{value}</p>
        )}
      </div>
      {onClick && <ChevronRight className="w-4 h-4 text-[#0E2538]/25 flex-shrink-0" />}
    </Comp>
  )
}

function ToggleRow({
  title,
  subtitle,
  on,
  onToggle,
}: {
  title: string
  subtitle?: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-[#0E2538]">
          <TranslatedText text={title} />
        </div>
        {subtitle && <div className="text-xs text-[#0E2538]/45 mt-0.5">{subtitle}</div>}
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
          on ? 'bg-[#3F8DD2]' : 'bg-[#0E2538]/20'
        }`}
        aria-pressed={on}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
            on ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  )
}
