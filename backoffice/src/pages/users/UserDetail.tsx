import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers, recentSort } from '../../lib/pocketbase'
import { deleteUserAndRelated } from '../../lib/deleteUser'
import { ArrowLeft, Edit, Mail, User, Trash2, CheckCircle, TrendingUp, Award, FileText, BarChart3, Activity, Brain, ChevronDown, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fmt, recordTypeColor, JsonBlock, TimeAgo, KYC_FIELDS, buildRecentActivityEvents } from '../../components/users/userDetailHelpers'
import { getUserLastActive, isUserActiveWithinDays, daysSinceLastActive } from '../../lib/userActivity'
import { fetchActivityByUser } from '../../lib/fetchActivityByUser'
import EditAppUserModal from './EditAppUserModal'

type TabType = 'overview' | 'program' | 'cravings' | 'journal' | 'achievements' | 'analytics' | 'activity' | 'ai_insights'

export const UserDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [showEdit, setShowEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => adminCollectionHelpers.getOne('users', id!),
    enabled: !!id,
  })

  const { data: profileData } = useQuery({
    queryKey: ['user_profile', id],
    queryFn: async () => {
      const result = await adminCollectionHelpers.getFullList('user_profiles', {
        filter: `user = "${id}"`,
      })
      return result.data?.[0] || null
    },
    enabled: !!id,
  })

  const { data: sessionsData } = useQuery({
    queryKey: ['user_sessions', id],
    queryFn: () => adminCollectionHelpers.getFullList('user_sessions', {
      filter: `user = "${id}"`,
      sort: recentSort('user_sessions'),
    }),
    enabled: !!id,
  })

  const { data: cravingsData } = useQuery({
    queryKey: ['user_cravings', id],
    queryFn: () => adminCollectionHelpers.getFullList('cravings', {
      filter: `user = "${id}"`,
      sort: recentSort('cravings'),
    }),
    enabled: !!id,
  })

  const { data: journalData } = useQuery({
    queryKey: ['user_journal', id],
    queryFn: () => adminCollectionHelpers.getFullList('journal_entries', {
      filter: `user = "${id}"`,
      sort: '-date,-created',
    }),
    enabled: !!id,
  })

  const { data: achievementsData } = useQuery({
    queryKey: ['user_achievements', id],
    queryFn: () => adminCollectionHelpers.getFullList('user_achievements', {
      filter: `user = "${id}"`,
      expand: 'achievement',
      sort: '-unlocked_at,-id',
    }),
    enabled: !!id,
  })

  const { data: progressData } = useQuery({
    queryKey: ['user_progress', id],
    queryFn: () => adminCollectionHelpers.getFullList('progress_stats', {
      filter: `user = "${id}"`,
    }),
    enabled: !!id,
  })

  const { data: behaviorProfileData } = useQuery({
    queryKey: ['user_behavior_profile', id],
    queryFn: () => adminCollectionHelpers.getFullList('user_behavior_profiles', {
      filter: `user = "${id}"`,
    }),
    enabled: !!id && activeTab === 'ai_insights',
  })

  const { data: personalizationLogsData } = useQuery({
    queryKey: ['personalization_logs', id],
    queryFn: () => adminCollectionHelpers.getList('personalization_logs', 1, 50, {
      filter: `user = "${id}"`,
      sort: '-created',
    }),
    enabled: !!id && activeTab === 'ai_insights',
  })

  const { data: sessionAiMemoryData } = useQuery({
    queryKey: ['session_ai_memory', id],
    queryFn: () => adminCollectionHelpers.getFullList('session_ai_memory', {
      filter: `user = "${id}"`,
      sort: '-day_number,-id',
    }),
    enabled: !!id && activeTab === 'ai_insights',
  })

  const { data: notificationEventsData } = useQuery({
    queryKey: ['notification_events', id],
    queryFn: () => adminCollectionHelpers.getFullList('notification_events', {
      filter: `user = "${id}"`,
      sort: '-id',
    }),
    enabled: !!id && activeTab === 'ai_insights',
  })

  const { data: beliefAssessmentsData } = useQuery({
    queryKey: ['belief_assessments', id],
    queryFn: () => adminCollectionHelpers.getFullList('belief_assessments', {
      filter: `user = "${id}"`,
      sort: 'assessment_day',
    }),
    enabled: !!id && activeTab === 'ai_insights',
  })

  const { data: sessionProgressData } = useQuery({
    queryKey: ['session_progress', id],
    queryFn: () => adminCollectionHelpers.getFullList('session_progress', {
      filter: `user = "${id}"`,
      expand: 'program_day',
      sort: '-completed_at,-id',
    }),
    enabled: !!id,
  })

  const { data: stepResponsesData } = useQuery({
    queryKey: ['step_responses', id],
    queryFn: () => adminCollectionHelpers.getFullList('step_responses', {
      filter: `user = "${id}"`,
      expand: 'step',
      sort: '-id',
    }),
    enabled: !!id && activeTab === 'program',
  })

  const { data: activityByUserAll = new Map<string, number>() } = useQuery({
    queryKey: ['activity-by-user'],
    queryFn: fetchActivityByUser,
    staleTime: 60_000,
  })

  const { data: analyticsEventsData } = useQuery({
    queryKey: ['analytics_events', id],
    queryFn: () => adminCollectionHelpers.getFullList('analytics_events', {
      filter: `user = "${id}"`,
      sort: recentSort('analytics_events'),
    }),
    enabled: !!id && (activeTab === 'activity' || activeTab === 'analytics'),
  })

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [expandedMemoryId, setExpandedMemoryId] = useState<string | null>(null)
  const [showKyc, setShowKyc] = useState(false)

  useEffect(() => {
    if (searchParams.get('edit') === '1') {
      setShowEdit(true)
      const next = new URLSearchParams(searchParams)
      next.delete('edit')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const openEdit = () => setShowEdit(true)

  const handleDeleteUser = async () => {
    if (!id || !user) return
    const label = user.email || user.name || id
    if (!window.confirm(`Permanently delete ${label} and all linked data? This cannot be undone.`)) {
      return
    }
    setDeleting(true)
    try {
      const result = await deleteUserAndRelated(id)
      if (!result.success) {
        alert(result.error || 'Failed to delete user')
        return
      }
      queryClient.invalidateQueries({ queryKey: ['users'] })
      navigate('/users')
    } finally {
      setDeleting(false)
    }
  }

  const user = userData?.data
  const profile = profileData
  const sessions = sessionsData?.data || []
  const cravings = cravingsData?.data || []
  const journalEntries = journalData?.data || []
  const achievements = achievementsData?.data || []
  const progress = progressData?.data?.[0]
  const sessionProgressRows = sessionProgressData?.data || []
  const recentActivity = buildRecentActivityEvents({
    sessions,
    sessionProgress: sessionProgressRows,
    cravings,
    journalEntries,
    achievements,
  })
  const sessionsCompleted = sessionProgressRows.filter((row: any) => row.status === 'completed').length
  const activityUser = user as { id: string; lastActive?: string } | undefined
  const userIsActive = activityUser
    ? isUserActiveWithinDays(activityUser, activityByUserAll, 7)
    : false
  const lastActiveDate = activityUser
    ? getUserLastActive(activityUser, activityByUserAll.get(activityUser.id))
    : null
  const daysSince = activityUser ? daysSinceLastActive(activityUser, activityByUserAll) : null

  const tabs: { id: TabType; label: string; icon: typeof User }[] = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'program', label: 'Program Progress', icon: CheckCircle },
    { id: 'cravings', label: 'Craving History', icon: TrendingUp },
    { id: 'journal', label: 'Journal Entries', icon: FileText },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'activity', label: 'Activity Log', icon: Activity },
    { id: 'ai_insights', label: 'AI Insights', icon: Brain },
  ]

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">User not found</p>
        <button onClick={() => navigate('/users')} className="btn-primary mt-4">
          Back to Users
        </button>
      </div>
    )
  }

  const calculateDaysSmokeFree = () => {
    if (!profile?.quit_date) return 0
    const quitDate = new Date(profile.quit_date)
    const today = new Date()
    const diffTime = today.getTime() - quitDate.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  const daysSmokeFree = calculateDaysSmokeFree()
  const currentSession = sessions[0]
  const cravingsResisted = cravings.filter((c: any) => c.type === 'craving').length
  const slips = cravings.filter((c: any) => c.type === 'slip').length

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/users')}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-neutral-dark">{user.name || user.email}</h1>
          <p className="text-neutral-500 mt-1 font-mono text-sm">ID: {user.id}</p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`px-2 py-1 text-xs rounded ${
                userIsActive ? 'bg-success/10 text-success' : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              {userIsActive ? 'Active (7d)' : 'Inactive'}
            </span>
            {lastActiveDate ? (
              <span className="text-xs text-neutral-500">
                Last active {daysSince === 0 ? 'today' : daysSince === 1 ? 'yesterday' : `${daysSince} days ago`}
              </span>
            ) : (
              <span className="text-xs text-neutral-500">No app activity recorded</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2" type="button" disabled title="Coming soon">
            <Mail className="w-4 h-4" />
            Send Message
          </button>
          <button type="button" onClick={openEdit} className="btn-primary flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit User
          </button>
          <button
            type="button"
            onClick={handleDeleteUser}
            disabled={deleting}
            className="btn-danger flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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
      <div className="mt-6">
        {activeTab === 'overview' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Personal Information</h2>
                  <button type="button" onClick={openEdit} className="text-primary text-sm hover:underline">
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-neutral-500">Age</label>
                    <p className="font-medium">{profile?.age || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500">Gender</label>
                    <p className="font-medium">{profile?.gender || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500">Language</label>
                    <p className="font-medium">{profile?.language || '-'}</p>
                  </div>
              <div>
                    <label className="text-sm text-neutral-500">Quit Date</label>
                    <p className="font-medium">
                      {profile?.quit_date ? new Date(profile.quit_date).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-neutral-500">Days Smoke-Free</label>
                    <p className="font-medium text-2xl text-success">{daysSmokeFree} days</p>
                  </div>
                </div>
              </div>

              {/* Addiction Details */}
              <div className="bg-white rounded-lg shadow-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Addiction Details</h2>
                  <button type="button" onClick={openEdit} className="text-primary text-sm hover:underline">
                    Edit
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-neutral-500">Nicotine Forms</label>
                    <p className="font-medium">
                      {profile?.nicotine_forms?.join(', ') || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500">Daily Consumption</label>
                    <p className="font-medium">
                      {profile?.daily_consumption} {profile?.consumption_unit || 'units'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500">Years Using</label>
                    <p className="font-medium">
                      {profile?.how_long_using ? `${Math.floor(profile.how_long_using / 12)} years` : '-'}
                    </p>
              </div>
              <div>
                    <label className="text-sm text-neutral-500">Motivations</label>
                    <p className="font-medium">
                      {profile?.motivations?.join(', ') || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Personalization & Archetype */}
              <div className="bg-white rounded-lg shadow-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Personalization & Archetype</h2>
                  <button type="button" onClick={openEdit} className="text-primary text-sm hover:underline">
                    Edit
                  </button>
                </div>
                <div className="space-y-4">
                  {/* Quit Archetype */}
                  {profile?.quit_archetype && (
                    <div className="p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
                      <label className="text-sm text-neutral-500 block mb-1">Quit Archetype</label>
                      <p className="font-bold text-lg text-primary capitalize">
                        {profile.quit_archetype.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {profile.quit_archetype === 'escapist' && 'Tends to smoke when bored or seeking distraction'}
                        {profile.quit_archetype === 'stress_reactor' && 'Primarily smokes in response to stress and anxiety'}
                        {profile.quit_archetype === 'social_mirror' && 'Heavily influenced by social situations'}
                        {profile.quit_archetype === 'auto_pilot' && 'Smokes out of habit and routine'}
                      </p>
                    </div>
                  )}

                  {/* Smoking Triggers */}
                  <div>
                    <label className="text-sm text-neutral-500">Smoking Triggers</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile?.smoking_triggers && profile.smoking_triggers.length > 0 ? (
                        profile.smoking_triggers.map((trigger: string) => (
                          <span
                            key={trigger}
                            className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                          >
                            {trigger}
                          </span>
                        ))
                      ) : (
                        <p className="text-neutral-400 text-sm">No triggers recorded</p>
                      )}
                    </div>
                  </div>

                  {/* Emotional States */}
                  <div>
                    <label className="text-sm text-neutral-500">Emotional States Linked to Smoking</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile?.emotional_states && profile.emotional_states.length > 0 ? (
                        profile.emotional_states.map((state: string) => (
                          <span
                            key={state}
                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                          >
                            {state.replace('_', ' ')}
                          </span>
                        ))
                      ) : (
                        <p className="text-neutral-400 text-sm">No emotional states recorded</p>
                      )}
                    </div>
                  </div>

                  {/* Fear Index */}
                  <div>
                    <label className="text-sm text-neutral-500">Fear Index (Health Concerns)</label>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1">
                        <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
                            style={{ width: `${((profile?.fear_index || 0) / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="font-bold text-2xl min-w-[3rem] text-right">
                        {profile?.fear_index ?? '-'}/10
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      {(profile?.fear_index || 0) <= 3 && 'Low concern about health consequences'}
                      {(profile?.fear_index || 0) > 3 && (profile?.fear_index || 0) <= 7 && 'Moderate concern about health consequences'}
                      {(profile?.fear_index || 0) > 7 && 'High concern about health consequences'}
                    </p>
                  </div>

                  {/* Quit Reason */}
                  <div>
                    <label className="text-sm text-neutral-500">Why They Want to Quit</label>
                    <p className="font-medium mt-1 p-3 bg-neutral-50 rounded-lg text-sm">
                      {profile?.quit_reason || 'No reason provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Onboarding / KYC */}
              <div className="bg-white rounded-lg shadow-card p-6">
                <button
                  type="button"
                  onClick={() => setShowKyc(v => !v)}
                  className="flex items-center justify-between w-full mb-4"
                >
                  <h2 className="text-lg font-semibold">Onboarding (KYC)</h2>
                  {showKyc ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                {showKyc && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {KYC_FIELDS.map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-xs text-neutral-500">{label}</label>
                        <p className="text-sm font-medium mt-0.5">{fmt((profile as any)?.[key])}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="bg-white rounded-lg shadow-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Settings</h2>
                  <button type="button" onClick={openEdit} className="text-primary text-sm hover:underline">
                    Edit
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-neutral-500">Email</label>
                    <p className="font-medium flex items-center gap-2">
                      {user.email}
                      <CheckCircle className="w-4 h-4 text-success" />
                    </p>
              </div>
              <div>
                    <label className="text-sm text-neutral-500">Notifications</label>
                <div className="mt-1 space-y-1 text-sm font-medium">
                  <p>Daily reminders: {profile?.enable_reminders ? 'On' : 'Off'}</p>
                  <p>
                    Craving alerts:{' '}
                    {profile?.enable_craving_alerts === false ? 'Off' : 'On'}
                  </p>
                  <p>
                    Achievements:{' '}
                    {profile?.enable_achievement_notifications === false ? 'Off' : 'On'}
                  </p>
                </div>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500">Daily Reminder Time</label>
                    <p className="font-medium">{profile?.daily_reminder_time || '-'}</p>
              </div>
            </div>
          </div>
        </div>

            {/* Right Column */}
        <div className="space-y-6">
              {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-card p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
                <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Sessions Completed</span>
                    <span className="font-semibold">
                      {sessionsCompleted}
                    </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Cravings Logged</span>
                    <span className="font-semibold">{cravings.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Cravings Resisted</span>
                    <span className="font-semibold text-success">{cravingsResisted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Slips</span>
                    <span className="font-semibold text-danger">{slips}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Journal Entries</span>
                    <span className="font-semibold">{journalEntries.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Achievements</span>
                    <span className="font-semibold">{achievements.length}</span>
                  </div>
                </div>
              </div>

              {/* Progress Stats */}
              <div className="bg-white rounded-lg shadow-card p-6">
                <h2 className="text-lg font-semibold mb-4">Progress Stats</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-neutral-500">Days Smoke-Free</label>
                    <p className="text-3xl font-bold text-success">{daysSmokeFree}</p>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500">Cigarettes NOT Smoked</label>
                    <p className="font-semibold">{progress?.cigarettes_not_smoked || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500">Money Saved</label>
                    <p className="font-semibold text-success">
                      ₹{progress?.money_saved?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500">Life Regained</label>
                    <p className="font-semibold">{progress?.life_regained_hours || 0} hours</p>
                  </div>
                  <button className="btn-secondary w-full mt-4">Recalculate</button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-card p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
                <div className="space-y-3 text-sm">
                  {recentActivity.length === 0 ? (
                    <p className="text-neutral-500">No activity recorded yet.</p>
                  ) : (
                    recentActivity.map((event) => {
                      const Icon =
                        event.icon === 'session'
                          ? CheckCircle
                          : event.icon === 'craving'
                            ? TrendingUp
                            : event.icon === 'journal'
                              ? FileText
                              : Award
                      return (
                        <div key={event.id} className="flex items-start gap-2">
                          <Icon className="w-4 h-4 text-success mt-0.5" />
                          <div>
                            <p>{event.message}</p>
                            <p className="text-xs text-neutral-500">
                              <TimeAgo date={event.date} />
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('activity')}
                  className="mt-4 text-sm text-primary hover:underline"
                >
                  View all activity →
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'program' && (() => {
          const progressRows = sessionProgressData?.data || []
          const stepRows = stepResponsesData?.data || []
          return (
          <div className="space-y-6">
            {currentSession && (
              <div className="bg-white rounded-lg shadow-card p-6">
                <h2 className="text-lg font-semibold mb-4">Current Program</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-neutral-500">Status</label>
                    <p className="font-medium">{currentSession.status}</p>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500">Current Day</label>
                    <p className="font-medium">{currentSession.current_day}/30</p>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500">Started</label>
                    <p className="font-medium">
                      {currentSession.started_at
                        ? new Date(currentSession.started_at).toLocaleString()
                        : currentSession.created
                          ? new Date(currentSession.created).toLocaleString()
                          : '-'}
                    </p>
                    {(currentSession.started_at || currentSession.created) && (
                      <p className="text-xs text-neutral-500 mt-1">
                        <TimeAgo date={currentSession.started_at || currentSession.created} />
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500">Last Activity</label>
                    <p className="font-medium">
                      {currentSession.updated ? formatDistanceToNow(new Date(currentSession.updated), { addSuffix: true }) : '-'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white rounded-lg shadow-card p-6">
              <h2 className="text-lg font-semibold mb-4">Session Progress ({progressRows.length})</h2>
              {progressRows.length === 0 ? (
                <p className="text-neutral-500">No session progress recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 text-neutral-500 font-medium">Day</th>
                        <th className="pb-2 text-neutral-500 font-medium">Status</th>
                        <th className="pb-2 text-neutral-500 font-medium">Last step</th>
                        <th className="pb-2 text-neutral-500 font-medium">Time spent</th>
                        <th className="pb-2 text-neutral-500 font-medium">Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {progressRows.map((row: any) => (
                        <tr key={row.id} className="border-b last:border-0">
                          <td className="py-2 font-medium">
                            {row.expand?.program_day?.day_number != null
                              ? `Day ${row.expand.program_day.day_number}`
                              : row.program_day?.slice(0, 8) || '—'}
                          </td>
                          <td className="py-2 capitalize">{row.status || '—'}</td>
                          <td className="py-2">{row.last_step_index ?? '—'}</td>
                          <td className="py-2">{row.time_spent_minutes != null ? `${row.time_spent_minutes} min` : '—'}</td>
                          <td className="py-2 text-neutral-600">
                            {row.completed_at ? new Date(row.completed_at).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="bg-white rounded-lg shadow-card p-6">
              <h2 className="text-lg font-semibold mb-4">Step Responses ({stepRows.length})</h2>
              {stepRows.length === 0 ? (
                <p className="text-neutral-500">No step responses yet.</p>
              ) : (
                <div className="space-y-3">
                  {stepRows.map((row: any) => {
                    const step = row.expand?.step
                    const question = String(
                      row.response_json?.question ||
                        step?.content_json?.question ||
                        step?.content_json?.prompt ||
                        step?.plain_text ||
                        ''
                    )
                      .replace(/\s+/g, ' ')
                      .trim()
                    const label =
                      row.response_json?.step_title ||
                      step?.step_title ||
                      step?.slug ||
                      (typeof row.step === 'string' ? row.step : row.step?.id) ||
                      'Unknown step'
                    return (
                    <div key={row.id} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex justify-between gap-3 text-xs text-neutral-500 mb-2">
                        <span className="min-w-0">
                          <span className="font-medium text-neutral-700">{label}</span>
                          {step?.type ? (
                            <span className="ml-2 text-neutral-400">{step.type}</span>
                          ) : null}
                        </span>
                        <span className="shrink-0">{row.created ? new Date(row.created).toLocaleString() : ''}</span>
                      </div>
                      {question ? (
                        <p className="text-sm text-neutral-600 mb-2 line-clamp-3">{question}</p>
                      ) : null}
                      <JsonBlock data={row.response_json} />
                      {row.ai_analysis && (
                        <div className="mt-2">
                          <p className="text-xs text-neutral-500 mb-1">AI analysis</p>
                          <JsonBlock data={row.ai_analysis} />
                        </div>
                      )}
                    </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          )
        })()}

        {activeTab === 'cravings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-card p-6">
              <h2 className="text-lg font-semibold mb-4">Craving History</h2>
              <div className="space-y-4">
                {cravings.length === 0 ? (
                  <p className="text-neutral-500 text-center py-8">No cravings logged yet</p>
                ) : (
                  cravings.map((craving: any) => (
                    <div key={craving.id} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          craving.type === 'slip' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                        }`}>
                          {craving.type === 'slip' ? 'Slip' : 'Craving Resisted'}
                        </span>
                        <span className="text-sm text-neutral-500">
                          {new Date(craving.created).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div>
                          <span className="text-sm text-neutral-500">Intensity: </span>
                          <span className="font-medium">{'⭐'.repeat(craving.intensity || 0)}</span>
                        </div>
                        <div>
                          <span className="text-sm text-neutral-500">Trigger: </span>
                          <span className="font-medium">{craving.trigger}</span>
                        </div>
                      </div>
                      {craving.notes && (
                        <p className="text-sm text-neutral-600 mt-2">{craving.notes}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-card p-6">
              <h2 className="text-lg font-semibold mb-4">Journal Entries</h2>
              <div className="space-y-4">
                {journalEntries.length === 0 ? (
                  <p className="text-neutral-500 text-center py-8">No journal entries yet</p>
                ) : (
                  journalEntries.map((entry: any) => (
                    <div key={entry.id} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{entry.mood === 'happy' ? '😊' : entry.mood === 'sad' ? '😔' : '😐'}</span>
                        <span className="text-sm text-neutral-500">
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                      </div>
                      {entry.title && (
                        <h3 className="font-semibold mb-2">{entry.title}</h3>
                      )}
                      <p className="text-sm text-neutral-600">{entry.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-card p-6">
              <h2 className="text-lg font-semibold mb-4">Unlocked Achievements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.length === 0 ? (
                  <p className="text-neutral-500 col-span-full text-center py-8">No achievements unlocked yet</p>
                ) : (
                  achievements.map((ua: any) => (
                    <div key={ua.id} className="border border-neutral-200 rounded-lg p-4 text-center">
                      <div className="text-4xl mb-2">🏆</div>
                      <h3 className="font-semibold">{ua.expand?.achievement?.title || 'Achievement'}</h3>
                      <p className="text-sm text-neutral-500 mt-1">
                        Unlocked {ua.unlocked_at ? formatDistanceToNow(new Date(ua.unlocked_at), { addSuffix: true }) : ''}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (() => {
          const events = analyticsEventsData?.data || []
          const counts: Record<string, number> = {}
          events.forEach((e: any) => { counts[e.event_type] = (counts[e.event_type] || 0) + 1 })
          const comprehension = events.filter((e: any) => e.event_type?.includes('comprehension'))
          return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-card p-6">
              <h2 className="text-lg font-semibold mb-4">Event Summary</h2>
              {events.length === 0 ? (
                <p className="text-neutral-500">No analytics events yet.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                    <div key={type} className="p-3 bg-neutral-50 rounded-lg">
                      <div className="text-xs text-neutral-500 truncate">{type}</div>
                      <div className="text-xl font-bold">{count}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {comprehension.length > 0 && (
              <div className="bg-white rounded-lg shadow-card p-6">
                <h2 className="text-lg font-semibold mb-4">Comprehension Analytics</h2>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600 font-medium">
                    Passed: {comprehension.filter((e: any) => e.event_type === 'comprehension_check_passed').length}
                  </span>
                  <span className="text-red-600 font-medium">
                    Failed: {comprehension.filter((e: any) => e.event_type === 'comprehension_check_failed').length}
                  </span>
                  <span className="text-amber-600 font-medium">
                    Re-reads: {comprehension.filter((e: any) => e.event_type === 'comprehension_reread_requested').length}
                  </span>
                </div>
              </div>
            )}
          </div>
          )
        })()}

        {activeTab === 'activity' && (() => {
          const events = analyticsEventsData?.data || []
          return (
          <div className="bg-white rounded-lg shadow-card p-6">
            <h2 className="text-lg font-semibold mb-4">Activity Log ({events.length})</h2>
            {events.length === 0 ? (
              <p className="text-neutral-500">No activity recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {events.map((event: any) => (
                  <div key={event.id} className="flex gap-3 py-2 border-b border-neutral-100 last:border-0 text-sm">
                    <div className="text-neutral-400 whitespace-nowrap text-xs pt-0.5 min-w-[120px]">
                      {event.created ? new Date(event.created).toLocaleString() : event.id?.slice(0, 8)}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{event.event_type}</span>
                      {event.meta && Object.keys(event.meta).length > 0 && (
                        <span className="text-neutral-500 ml-2 text-xs">
                          {JSON.stringify(event.meta)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )
        })()}

        {activeTab === 'ai_insights' && (() => {
          const bp = behaviorProfileData?.data?.[0]
          const rawData = personalizationLogsData?.data as any
          const logs = rawData?.items || rawData || []
          const memoryRows = sessionAiMemoryData?.data || []
          const notifications = notificationEventsData?.data || []
          const beliefs = beliefAssessmentsData?.data || []
          const comprehensionChecks = memoryRows.filter((r: any) => r.record_type === 'comprehension_check')
          const comprehensionPasses = comprehensionChecks.filter((r: any) => r.is_correct).length

          return (
            <div className="space-y-6">
              {/* Behavioral Profile */}
              <div className="bg-white rounded-lg shadow-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Behavioral Profile
                </h2>
                {!bp ? (
                  <p className="text-neutral-500">No behavioral profile computed yet (user in observation phase or insufficient data).</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <div className="text-xs text-neutral-500 mb-1">Learning Phase</div>
                      <div className={`text-sm font-semibold ${bp.learning_phase === 'active' ? 'text-green-600' : 'text-amber-600'}`}>
                        {bp.learning_phase === 'active' ? '🟢 Active' : '🟡 Observing'}
                      </div>
                      <div className="text-xs text-neutral-400">{bp.days_observed} days observed</div>
                    </div>
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <div className="text-xs text-neutral-500 mb-1">Assigned Archetype</div>
                      <div className="text-sm font-semibold capitalize">{bp.assigned_archetype?.replace('_', ' ')}</div>
                    </div>
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <div className="text-xs text-neutral-500 mb-1">Behavioral Archetype</div>
                      <div className="text-sm font-semibold capitalize">{bp.behavioral_archetype?.replace('_', ' ')}</div>
                      <div className="text-xs text-neutral-400">Confidence: {((bp.archetype_confidence || 0) * 100).toFixed(0)}%</div>
                    </div>
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <div className="text-xs text-neutral-500 mb-1">Dominant Trigger</div>
                      <div className="text-sm font-semibold capitalize">{bp.dominant_trigger}</div>
                    </div>
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <div className="text-xs text-neutral-500 mb-1">Intensity Trend</div>
                      <div className={`text-sm font-semibold ${bp.intensity_trend === 'falling' ? 'text-green-600' : bp.intensity_trend === 'rising' ? 'text-red-600' : 'text-neutral-600'}`}>
                        {bp.intensity_trend === 'falling' ? '↓ Falling' : bp.intensity_trend === 'rising' ? '↑ Rising' : '→ Stable'}
                      </div>
                    </div>
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <div className="text-xs text-neutral-500 mb-1">Mood Trend</div>
                      <div className={`text-sm font-semibold ${bp.mood_trend === 'improving' ? 'text-green-600' : bp.mood_trend === 'declining' ? 'text-red-600' : 'text-neutral-600'}`}>
                        {bp.mood_trend === 'improving' ? '↑ Improving' : bp.mood_trend === 'declining' ? '↓ Declining' : '→ Stable'}
                      </div>
                    </div>
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <div className="text-xs text-neutral-500 mb-1">Peak Active Hour</div>
                      <div className="text-sm font-semibold">{bp.peak_active_hour}:00</div>
                    </div>
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <div className="text-xs text-neutral-500 mb-1">Avg Session Time</div>
                      <div className="text-sm font-semibold">{bp.avg_session_minutes} min</div>
                    </div>
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <div className="text-xs text-neutral-500 mb-1">Notification Open Rate</div>
                      <div className="text-sm font-semibold">{((bp.notification_open_rate || 0) * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Session AI Memory */}
              <div className="bg-white rounded-lg shadow-card p-6">
                <h2 className="text-lg font-semibold mb-2">Session AI Memory ({memoryRows.length})</h2>
                <p className="text-sm text-neutral-500 mb-4">
                  Stored personalization payloads, trigger checks, comprehension results, and re-read events.
                  {comprehensionChecks.length > 0 && (
                    <span className="ml-2 font-medium text-neutral-700">
                      Comprehension: {comprehensionPasses}/{comprehensionChecks.length} passed
                    </span>
                  )}
                </p>
                {memoryRows.length === 0 ? (
                  <p className="text-neutral-500">No session AI memory yet.</p>
                ) : (
                  <div className="space-y-2">
                    {memoryRows.map((row: any) => {
                      const p = row.payload_json || {}
                      const expanded = expandedMemoryId === row.id
                      return (
                        <div key={row.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setExpandedMemoryId(expanded ? null : row.id)}
                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-neutral-50"
                          >
                            {expanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${recordTypeColor(row.record_type)}`}>
                              {row.record_type}
                            </span>
                            <span className="text-sm font-medium">Day {row.day_number}</span>
                            {row.source && <span className="text-xs text-neutral-400">({row.source})</span>}
                            {row.record_type === 'personalization' && p.session_intro && (
                              <span className="text-xs text-neutral-500 truncate flex-1">{p.session_intro}</span>
                            )}
                            {row.record_type === 'trigger_check' && (
                              <span className="text-xs text-neutral-500">→ {p.selected || '—'}</span>
                            )}
                            {row.record_type === 'comprehension_check' && (
                              <span className={`text-xs font-medium ${row.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                                {row.is_correct ? 'Passed' : 'Failed'} — {p.selected || '—'}
                              </span>
                            )}
                            <span className="text-xs text-neutral-400 ml-auto"><TimeAgo date={row.created} /></span>
                          </button>
                          {expanded && (
                            <div className="px-3 pb-3 border-t border-neutral-100">
                              <JsonBlock data={p} />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Personalization Log */}
              <div className="bg-white rounded-lg shadow-card p-6">
                <h2 className="text-lg font-semibold mb-4">Personalization Log ({(logs as any[]).length})</h2>
                {(logs as any[]).length === 0 ? (
                  <p className="text-neutral-500">No personalization events yet.</p>
                ) : (
                  <div className="space-y-2">
                    {(logs as any[]).map((log: any) => {
                      const expanded = expandedLogId === log.id
                      const hasPayload = log.content_payload && Object.keys(log.content_payload).length > 0
                      return (
                        <div key={log.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(expanded ? null : log.id)}
                            className="w-full p-3 text-left hover:bg-neutral-50"
                          >
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              <span className="text-neutral-600"><TimeAgo date={log.created} /></span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                log.request_type === 'session_content' ? 'bg-blue-50 text-blue-700' :
                                log.request_type === 'notification' ? 'bg-purple-50 text-purple-700' :
                                'bg-neutral-100 text-neutral-600'
                              }`}>{log.request_type}</span>
                              <span>Day {log.day_number}</span>
                              <span className="capitalize text-neutral-600">{log.archetype_used?.replace('_', ' ')}</span>
                              {log.content_fit_score != null && (
                                <span className={`font-medium ${log.content_fit_score >= 8 ? 'text-green-600' : log.content_fit_score >= 6 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {log.content_fit_score}/10
                                </span>
                              )}
                              {hasPayload && <span className="text-xs text-green-600">full payload</span>}
                              <span className="text-xs text-neutral-400 ml-auto">{(log.okf_docs_loaded || []).length} docs</span>
                            </div>
                            {log.ai_response_summary && (
                              <p className="text-xs text-neutral-500 mt-1 ml-6">{log.ai_response_summary}</p>
                            )}
                          </button>
                          {expanded && (
                            <div className="px-3 pb-3 border-t border-neutral-100 space-y-2">
                              {hasPayload ? (
                                <>
                                  {log.content_payload.session_intro && (
                                    <div>
                                      <p className="text-xs font-medium text-neutral-500 mb-1">Session intro</p>
                                      <p className="text-sm italic">{log.content_payload.session_intro}</p>
                                    </div>
                                  )}
                                  {log.content_payload.journal_prompt && (
                                    <div>
                                      <p className="text-xs font-medium text-neutral-500 mb-1">Journal prompt</p>
                                      <p className="text-sm">{log.content_payload.journal_prompt}</p>
                                    </div>
                                  )}
                                  <JsonBlock data={log.content_payload} />
                                </>
                              ) : (
                                <p className="text-sm text-neutral-400">No content_payload stored for this entry.</p>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Belief Assessments */}
              <div className="bg-white rounded-lg shadow-card p-6">
                <h2 className="text-lg font-semibold mb-4">Belief Assessments ({beliefs.length})</h2>
                {beliefs.length === 0 ? (
                  <p className="text-neutral-500">No belief assessments yet (days 0, 15, 30).</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 text-neutral-500 font-medium">Day</th>
                          <th className="pb-2 text-neutral-500 font-medium">Relaxation</th>
                          <th className="pb-2 text-neutral-500 font-medium">Enjoyment</th>
                          <th className="pb-2 text-neutral-500 font-medium">Concentration</th>
                          <th className="pb-2 text-neutral-500 font-medium">Social</th>
                          <th className="pb-2 text-neutral-500 font-medium">Stress relief</th>
                          <th className="pb-2 text-neutral-500 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {beliefs.map((b: any) => (
                          <tr key={b.id} className="border-b last:border-0">
                            <td className="py-2 font-medium">Day {b.assessment_day}</td>
                            <td className="py-2">{b.belief_relaxation}/10</td>
                            <td className="py-2">{b.belief_enjoyment}/10</td>
                            <td className="py-2">{b.belief_concentration}/10</td>
                            <td className="py-2">{b.belief_social}/10</td>
                            <td className="py-2">{b.belief_stress_relief}/10</td>
                            <td className="py-2 font-semibold">{b.total_score ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Notification Events */}
              <div className="bg-white rounded-lg shadow-card p-6">
                <h2 className="text-lg font-semibold mb-4">AI Notifications Sent ({notifications.length})</h2>
                {notifications.length === 0 ? (
                  <p className="text-neutral-500">No notification events yet.</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((n: any) => (
                      <div key={n.id} className="border border-neutral-200 rounded-lg p-4">
                        <div className="flex justify-between text-xs text-neutral-500 mb-2">
                          <span className="capitalize">{n.trigger_type?.replace('_', ' ')}</span>
                          <span>{n.sent_at ? new Date(n.sent_at).toLocaleString() : '—'}</span>
                        </div>
                        <p className="font-semibold text-sm">{n.message_title}</p>
                        <p className="text-sm text-neutral-600 mt-1">{n.message_body}</p>
                        <div className="flex gap-3 mt-2 text-xs text-neutral-500">
                          <span>Day {n.day_number ?? '—'}</span>
                          <span className="capitalize">{n.archetype_at_send?.replace('_', ' ')}</span>
                          {n.opened_at && <span className="text-green-600">Opened</span>}
                          {n.led_to_session && <span className="text-blue-600">Led to session</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </div>
    </div>

    {showEdit && user && (
      <EditAppUserModal
        user={user as { id: string; name?: string; email?: string }}
        profile={(profile as any) || null}
        onClose={() => setShowEdit(false)}
      />
    )}
    </>
  )
}
