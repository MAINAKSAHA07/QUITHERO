import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { ArrowLeft, Edit, Mail, User, Trash2, CheckCircle, TrendingUp, Award, FileText, BarChart3, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type TabType = 'overview' | 'program' | 'cravings' | 'journal' | 'achievements' | 'analytics' | 'activity'

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
      sort: '-created',
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
      </div>
    </div>
  )
}
