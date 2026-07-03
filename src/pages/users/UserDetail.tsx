import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminCollectionHelpers, recentSort } from '../../lib/pocketbase'
import { ArrowLeft, Edit, Mail, User, Trash2, CheckCircle, TrendingUp, Award, FileText, BarChart3, Activity, Brain } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type TabType = 'overview' | 'program' | 'cravings' | 'journal' | 'achievements' | 'analytics' | 'activity' | 'ai_insights'

export const UserDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('overview')

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
    }),
    enabled: !!id,
  })

  const { data: cravingsData } = useQuery({
    queryKey: ['user_cravings', id],
    queryFn: () => adminCollectionHelpers.getFullList('cravings', {
      filter: `user = "${id}"`,
      sort: recentSort('cravings'),
    }),
    enabled: !!id && activeTab === 'cravings',
  })

  const { data: journalData } = useQuery({
    queryKey: ['user_journal', id],
    queryFn: () => adminCollectionHelpers.getFullList('journal_entries', {
      filter: `user = "${id}"`,
      sort: '-date',
    }),
    enabled: !!id && activeTab === 'journal',
  })

  const { data: achievementsData } = useQuery({
    queryKey: ['user_achievements', id],
    queryFn: () => adminCollectionHelpers.getFullList('user_achievements', {
      filter: `user = "${id}"`,
      expand: 'achievement',
      sort: '-unlocked_at',
    }),
    enabled: !!id && activeTab === 'achievements',
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
    queryFn: () => adminCollectionHelpers.getList('personalization_logs', 1, 20, {
      filter: `user = "${id}"`,
      sort: '-created',
    }),
    enabled: !!id && activeTab === 'ai_insights',
  })

  const user = userData?.data
  const profile = profileData
  const sessions = sessionsData?.data || []
  const cravings = cravingsData?.data || []
  const journalEntries = journalData?.data || []
  const achievements = achievementsData?.data || []
  const progress = progressData?.data?.[0]

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
            <span className="px-2 py-1 text-xs bg-success/10 text-success rounded">Active</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Send Message
          </button>
        <button className="btn-primary flex items-center gap-2">
          <Edit className="w-4 h-4" />
          Edit User
        </button>
          <button className="btn-danger flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Delete
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
                  <button className="text-primary text-sm hover:underline">Edit</button>
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
                  <button className="text-primary text-sm hover:underline">Edit</button>
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
                  <button className="text-primary text-sm hover:underline">Edit</button>
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

              {/* Settings */}
              <div className="bg-white rounded-lg shadow-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Settings</h2>
                  <button className="text-primary text-sm hover:underline">Edit</button>
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
                <p className="font-medium">
                      {profile?.enable_reminders ? 'Enabled' : 'Disabled'}
                </p>
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
                      {currentSession?.current_day || 0}/10
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
                  {sessions.length > 0 && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-success mt-0.5" />
                      <div>
                        <p>Completed Day {currentSession?.current_day}</p>
                        <p className="text-xs text-neutral-500">2 days ago</p>
                      </div>
                    </div>
                  )}
                  {cravings.length > 0 && (
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-warning mt-0.5" />
                      <div>
                        <p>Logged craving - {cravings[0]?.trigger}</p>
                        <p className="text-xs text-neutral-500">3 days ago</p>
                      </div>
                    </div>
                  )}
                  {journalEntries.length > 0 && (
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-secondary mt-0.5" />
                      <div>
                        <p>Created journal entry</p>
                        <p className="text-xs text-neutral-500">5 days ago</p>
                      </div>
                    </div>
                  )}
                  {achievements.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-warning mt-0.5" />
                      <div>
                        <p>Unlocked achievement</p>
                        <p className="text-xs text-neutral-500">7 days ago</p>
                      </div>
                    </div>
                  )}
                </div>
                <button className="mt-4 text-sm text-primary hover:underline">
                  View all activity →
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'program' && (
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
                    <p className="font-medium">{currentSession.current_day}/10</p>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500">Started</label>
                    <p className="font-medium">
                      {currentSession.started_at ? new Date(currentSession.started_at).toLocaleDateString() : '-'}
                    </p>
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
              <p className="text-neutral-500">Program days list will be displayed here</p>
            </div>
          </div>
        )}

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

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow-card p-6">
            <h2 className="text-lg font-semibold mb-4">User Analytics</h2>
            <p className="text-neutral-500">Analytics charts and visualizations will be displayed here</p>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-lg shadow-card p-6">
            <h2 className="text-lg font-semibold mb-4">Activity Log</h2>
            <p className="text-neutral-500">Activity timeline will be displayed here</p>
        </div>
        )}

        {activeTab === 'ai_insights' && (() => {
          const bp = behaviorProfileData?.data?.[0]
          const rawData = personalizationLogsData?.data as any
          const logs = rawData?.items || rawData || []
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

              {/* Personalization Log */}
              <div className="bg-white rounded-lg shadow-card p-6">
                <h2 className="text-lg font-semibold mb-4">Personalization Log (Last 7 Days)</h2>
                {(logs as any[]).length === 0 ? (
                  <p className="text-neutral-500">No personalization events yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 text-neutral-500 font-medium">Date</th>
                          <th className="pb-2 text-neutral-500 font-medium">Type</th>
                          <th className="pb-2 text-neutral-500 font-medium">Day</th>
                          <th className="pb-2 text-neutral-500 font-medium">Archetype</th>
                          <th className="pb-2 text-neutral-500 font-medium">Score</th>
                          <th className="pb-2 text-neutral-500 font-medium">Docs Loaded</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(logs as any[]).map((log: any) => (
                          <tr key={log.id} className="border-b last:border-0">
                            <td className="py-2 text-neutral-600">{log.created ? formatDistanceToNow(new Date(log.created), { addSuffix: true }) : '-'}</td>
                            <td className="py-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                log.request_type === 'session_content' ? 'bg-blue-50 text-blue-700' :
                                log.request_type === 'notification' ? 'bg-purple-50 text-purple-700' :
                                'bg-neutral-100 text-neutral-600'
                              }`}>{log.request_type}</span>
                            </td>
                            <td className="py-2 text-neutral-600">Day {log.day_number}</td>
                            <td className="py-2 capitalize text-neutral-600">{log.archetype_used?.replace('_', ' ')}</td>
                            <td className="py-2">
                              {log.content_fit_score != null ? (
                                <span className={`font-medium ${log.content_fit_score >= 8 ? 'text-green-600' : log.content_fit_score >= 6 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {log.content_fit_score}/10
                                </span>
                              ) : '-'}
                            </td>
                            <td className="py-2 text-xs text-neutral-400">{(log.okf_docs_loaded || []).length} docs</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
