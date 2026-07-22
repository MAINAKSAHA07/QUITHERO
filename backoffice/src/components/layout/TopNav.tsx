import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Bell, User, LogOut, X, Command, FileText, Users, BarChart3, Settings, HelpCircle, ArrowRight } from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { useNavigate } from 'react-router-dom'
import { adminCollectionHelpers, recentSort } from '../../lib/pocketbase'
import { formatDistanceToNow } from 'date-fns'

const READ_STORAGE_KEY = 'smono_admin_notif_read'

function safeRelativeTime(value?: string): string {
  if (!value?.trim()) return 'recently'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'recently'
  return formatDistanceToNow(d, { addSuffix: true })
}

function loadReadIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(READ_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    sessionStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...ids].slice(-200)))
  } catch {
    /* ignore quota */
  }
}

type AdminNotification = {
  id: string
  type: string
  title: string
  message: string
  time: string
  timeSort: number
  read: boolean
  path: string
}

interface SearchResult {
  type: 'user' | 'program' | 'article' | 'page'
  title: string
  description: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

export const TopNav = ({ collapsed = false }: { collapsed?: boolean }) => {
  const { user, logout } = useAdminAuth()
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds())

  // Fetch latest data to power notifications
  const { data: recentUsers } = useQuery({
    queryKey: ['nav', 'recent_users'],
    queryFn: () =>
      adminCollectionHelpers.getList('users', 1, 5, {
        sort: recentSort('users'),
      }),
    staleTime: 30_000,
  })

  const { data: recentTickets } = useQuery({
    queryKey: ['nav', 'recent_support_tickets'],
    queryFn: async () => {
      const result = await adminCollectionHelpers.getList('support_tickets', 1, 5, {
        filter: 'status = "open" || status = "in_progress"',
        sort: recentSort('support_tickets'),
      })
      if (result.success && result.data) return result
      return { success: true as const, data: { items: [], totalItems: 0, totalPages: 0, page: 1, perPage: 5 } }
    },
    retry: false,
    staleTime: 30_000,
  })

  const { data: recentAchievements } = useQuery({
    queryKey: ['nav', 'recent_achievements'],
    queryFn: () =>
      adminCollectionHelpers.getList('user_achievements', 1, 5, {
        sort: '-unlocked_at',
        expand: 'user,achievement',
      }),
    retry: false,
    staleTime: 30_000,
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearchModal(true)
      }
      if (e.key === 'Escape') {
        setShowSearchModal(false)
        setShowNotifications(false)
        setShowProfileMenu(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const notifications = useMemo((): AdminNotification[] => {
    const next: AdminNotification[] = []

    const userItems =
      recentUsers?.success && recentUsers.data && 'items' in recentUsers.data
        ? recentUsers.data.items
        : []
    for (const u of userItems as any[]) {
      const createdMs = u.created ? new Date(u.created).getTime() : 0
      next.push({
        id: `user_${u.id}`,
        type: 'user_registered',
        title: 'New user registered',
        message: `${u.name || u.email || 'User'} just signed up`,
        time: safeRelativeTime(u.created),
        timeSort: Number.isFinite(createdMs) ? createdMs : 0,
        read: readIds.has(`user_${u.id}`),
        path: `/users/${u.id}`,
      })
    }

    const ticketItems =
      recentTickets?.success && recentTickets.data && 'items' in recentTickets.data
        ? recentTickets.data.items
        : []
    for (const t of ticketItems as any[]) {
      const createdMs = t.created ? new Date(t.created).getTime() : 0
      next.push({
        id: `ticket_${t.id}`,
        type: 'support_ticket',
        title: `Support ticket: ${t.subject || 'New ticket'}`,
        message: t.priority ? `Priority: ${t.priority}` : 'Needs attention',
        time: safeRelativeTime(t.created),
        timeSort: Number.isFinite(createdMs) ? createdMs : 0,
        read: readIds.has(`ticket_${t.id}`),
        path: '/support/tickets',
      })
    }

    const achievementItems =
      recentAchievements?.success && recentAchievements.data && 'items' in recentAchievements.data
        ? recentAchievements.data.items
        : []
    for (const ua of achievementItems as any[]) {
      const unlocked = ua.unlocked_at || ua.created
      const unlockedMs = unlocked ? new Date(unlocked).getTime() : 0
      next.push({
        id: `achievement_${ua.id}`,
        type: 'achievement',
        title: 'Achievement unlocked',
        message: `${ua.expand?.user?.name || ua.expand?.user?.email || 'User'} unlocked "${ua.expand?.achievement?.title || 'Achievement'}"`,
        time: safeRelativeTime(unlocked),
        timeSort: Number.isFinite(unlockedMs) ? unlockedMs : 0,
        read: readIds.has(`achievement_${ua.id}`),
        path: '/achievements/logs',
      })
    }

    next.sort((a, b) => b.timeSort - a.timeSort)
    return next.slice(0, 15)
  }, [recentUsers, recentTickets, recentAchievements, readIds])

  const unreadCount = notifications.filter((n) => !n.read).length
  const hasTicketNotifs = notifications.some((n) => n.type === 'support_ticket')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const markRead = (ids: string[]) => {
    setReadIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) next.add(id)
      saveReadIds(next)
      return next
    })
  }

  const handleNotificationClick = (notification: AdminNotification) => {
    setShowNotifications(false)
    markRead([notification.id])
    navigate(notification.path)
  }

  const markAllAsRead = () => {
    markRead(notifications.map((n) => n.id))
  }

  // Search results based on query
  const searchResults: SearchResult[] = searchQuery
    ? ([
        { type: 'user' as const, title: 'All Users', description: 'View and manage all users', path: '/users', icon: Users },
        { type: 'program' as const, title: 'Programs', description: 'Manage programs and content', path: '/content/programs', icon: FileText },
        { type: 'page' as const, title: 'User Analytics', description: 'View user analytics and metrics', path: '/analytics/users', icon: BarChart3 },
        { type: 'page' as const, title: 'Settings', description: 'App settings and configuration', path: '/settings/app', icon: Settings },
        { type: 'page' as const, title: 'Help', description: 'Help documentation and FAQs', path: '/help', icon: HelpCircle },
      ] as SearchResult[]).filter(result => 
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [
        { type: 'page' as const, title: 'Dashboard', description: 'Go to dashboard', path: '/dashboard', icon: BarChart3 },
        { type: 'user' as const, title: 'All Users', description: 'View and manage all users', path: '/users', icon: Users },
        { type: 'program' as const, title: 'Programs', description: 'Manage programs and content', path: '/content/programs', icon: FileText },
      ] as SearchResult[]

  return (
    <>
      <header className="shrink-0 z-40 h-14 flex items-stretch bg-white/75 backdrop-blur-xl border-b border-white/50 shadow-[0_1px_0_rgba(14,37,56,0.06)]">
        {/* Brand aligns with sidebar width so the shell never drifts */}
        <div
          className={`shrink-0 flex items-center gap-2 px-4 border-r border-[#0E2538]/08 transition-[width] duration-200 ease-out ${
            collapsed ? 'w-16 justify-center px-0' : 'w-60'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary font-bold text-sm flex items-center justify-center">
            S
          </div>
          {!collapsed && (
            <h1 className="text-base font-semibold text-neutral-dark tracking-tight truncate">
              smono Admin
            </h1>
          )}
        </div>

        <div className="flex-1 min-w-0 flex items-center justify-between gap-3 px-4 sm:px-6">
          {/* Search */}
          <div className="flex-1 max-w-xl min-w-0">
            <button
              type="button"
              onClick={() => setShowSearchModal(true)}
              className="w-full flex items-center gap-3 px-3 py-2 border border-[#0E2538]/10 rounded-xl hover:border-primary/30 transition-colors text-left bg-white/70 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Search className="w-4 h-4 text-neutral-400 shrink-0" />
              <span className="flex-1 text-sm text-neutral-500 truncate">
                Search users, content, programs...
              </span>
              <kbd className="hidden sm:inline-flex text-xs text-neutral-400 border border-neutral-200 rounded px-1.5 py-0.5 items-center gap-0.5">
                <Command className="w-3 h-3" />K
              </kbd>
            </button>
          </div>

          {/* Right Section - Notifications & Profile */}
          <div className="flex items-center gap-2 shrink-0">
        {/* Notifications */}
        <div className="relative">
          <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowProfileMenu(false)
              }}
            className="relative p-2 hover:bg-white/80 rounded-xl transition-colors active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Bell className="w-5 h-5 text-neutral-600" />
              {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
              )}
          </button>
          {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-card-lg border border-white/70 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-primary hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-neutral-500">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors border-b border-neutral-100 ${
                            !notification.read ? 'bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-neutral-dark">{notification.title}</p>
                              <p className="text-xs text-neutral-500 mt-1">{notification.message}</p>
                              <p className="text-xs text-neutral-400 mt-1">{notification.time}</p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                            )}
                </div>
                        </button>
                      ))
                    )}
              </div>
                  {hasTicketNotifs && (
                    <div className="px-4 py-2 border-t border-neutral-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNotifications(false)
                          navigate('/support/tickets')
                        }}
                        className="text-xs text-primary hover:underline w-full text-center"
                      >
                        Open support inbox
                      </button>
                    </div>
                  )}
                </div>
              </>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu)
                setShowNotifications(false)
              }}
            className="flex items-center gap-2 p-2 hover:bg-white/80 rounded-xl transition-colors active:scale-[0.98]"
          >
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-medium">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <span className="text-sm font-medium hidden sm:inline max-w-[10rem] truncate">
              {user?.name || user?.email}
            </span>
          </button>
          {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-card-lg border border-white/70 z-50 overflow-hidden">
              <div className="px-4 py-2 border-b border-neutral-200">
                <p className="text-sm font-medium">{user?.name || 'Admin'}</p>
                <p className="text-xs text-neutral-500">{user?.email}</p>
                {user?.role && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                    {user.role}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false)
                  navigate('/settings/profile')
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                My Profile
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false)
                  navigate('/settings/app')
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2"
              >
                Settings
              </button>
              <div className="border-t border-neutral-200 mt-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 text-danger flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
              </>
          )}
        </div>
      </div>
        </div>
    </header>

      {/* Global Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          <div
            className="fixed inset-0 bg-[#0E2538]/40 backdrop-blur-sm"
            onClick={() => setShowSearchModal(false)}
          />
          <div className="relative w-full max-w-2xl mx-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-card-lg border border-white/70">
            {/* Search Input */}
            <div className="p-4 border-b border-[#0E2538]/08">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users, content, programs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-[#0E2538]/12 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/35 text-lg"
                  autoFocus
                />
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-neutral-100 rounded"
                >
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              </div>
            </div>

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="px-4 py-12 text-center text-neutral-500">
                  <Search className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                  <p>No results found</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="py-2">
                  {searchQuery && (
                    <div className="px-4 py-2 text-xs text-neutral-500 uppercase">
                      Quick Actions
                    </div>
                  )}
                  {searchResults.map((result, idx) => {
                    const Icon = result.icon
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          navigate(result.path)
                          setShowSearchModal(false)
                          setSearchQuery('')
                        }}
                        className="w-full px-4 py-3 hover:bg-neutral-50 flex items-center gap-3 text-left transition-colors"
                      >
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-neutral-dark">{result.title}</p>
                          <p className="text-sm text-neutral-500">{result.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-400" />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 border border-neutral-200 rounded">↑</kbd>
                  <kbd className="px-1.5 py-0.5 border border-neutral-200 rounded">↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 border border-neutral-200 rounded">Enter</kbd>
                  <span>Select</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 border border-neutral-200 rounded">Esc</kbd>
                <span>Close</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
