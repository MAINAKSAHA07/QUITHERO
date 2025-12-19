import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Bell, User, LogOut, X, Command, FileText, Users, BarChart3, Settings, HelpCircle, ArrowRight } from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { useNavigate } from 'react-router-dom'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { formatDistanceToNow } from 'date-fns'

interface SearchResult {
  type: 'user' | 'program' | 'article' | 'page'
  title: string
  description: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

export const TopNav = () => {
  const { user, logout } = useAdminAuth()
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState<any[]>([])

  // Fetch latest data to power notifications
  const { data: recentUsers } = useQuery({
    queryKey: ['nav', 'recent_users'],
    queryFn: () =>
      adminCollectionHelpers.getList('users', 1, 5, {
        sort: '-created',
      }),
  })

  const { data: recentTickets } = useQuery({
    queryKey: ['nav', 'recent_support_tickets'],
    queryFn: async () => {
      try {
        // Try to fetch support tickets with proper error handling
        const result = await adminCollectionHelpers.getList('support_tickets', 1, 5, {
          filter: '(status = "open" || status = "in_progress")',
          sort: '-created',
          // Don't expand user if it might cause issues - we can access it later if needed
        })
        
        // Check if the result is successful
        if (result.success && result.data) {
          return result
        }
        
        // If not successful, return empty
        return { success: true, data: { items: [], totalItems: 0, totalPages: 0 } }
      } catch (error: any) {
        // If collection doesn't exist or has errors, return empty
        console.warn('Error fetching support_tickets for notifications:', error)
        return { success: true, data: { items: [], totalItems: 0, totalPages: 0 } }
      }
    },
    retry: false, // collection might not exist yet
    staleTime: 30000, // Cache for 30 seconds
  })

  const { data: recentAchievements } = useQuery({
    queryKey: ['nav', 'recent_achievements'],
    queryFn: () =>
      adminCollectionHelpers.getList('user_achievements', 1, 5, {
        sort: '-unlocked_at',
        expand: 'user,achievement',
      }),
    retry: false,
  })

  useEffect(() => {
    // Listen for ⌘K or Ctrl+K to open search
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

  // Build notifications from live PocketBase data
  useEffect(() => {
    const next: any[] = []

    // Recent user registrations
    if (recentUsers?.data && 'items' in recentUsers.data && Array.isArray(recentUsers.data.items)) {
      recentUsers.data.items.forEach((u: any) => {
        next.push({
          id: `user_${u.id}`,
          type: 'user_registered',
          title: 'New user registered',
          message: `${u.name || u.email || 'User'} just signed up`,
          time: formatDistanceToNow(new Date(u.created), { addSuffix: true }),
          read: false,
          path: '/users',
        })
      })
    }

    // Recent open / in‑progress support tickets
    if (recentTickets?.data && 'items' in recentTickets.data && Array.isArray(recentTickets.data.items)) {
      recentTickets.data.items.forEach((t: any) => {
        next.push({
          id: `ticket_${t.id}`,
          type: 'support_ticket',
          title: `Support ticket: ${t.subject || 'New ticket'}`,
          message: t.message?.slice(0, 80) || 'New support ticket requires attention',
          time: formatDistanceToNow(new Date(t.created), { addSuffix: true }),
          read: false,
          path: '/support/tickets',
        })
      })
    }

    // Recent achievement unlocks
    if (recentAchievements?.data && 'items' in recentAchievements.data && Array.isArray(recentAchievements.data.items)) {
      recentAchievements.data.items.forEach((ua: any) => {
        next.push({
          id: `achievement_${ua.id}`,
          type: 'achievement',
          title: 'Achievement unlocked',
          message: `${ua.expand?.user?.name || 'User'} unlocked "${ua.expand?.achievement?.title || 'Achievement'}"`,
          time: formatDistanceToNow(new Date(ua.unlocked_at || ua.created), { addSuffix: true }),
          read: true,
          path: '/achievements/logs',
        })
      })
    }

    // Sort newest first and limit to last 15
    next.sort((a, b) => {
      const ta = a.timeSort || 0
      const tb = b.timeSort || 0
      return tb - ta
    })

    setNotifications(next.slice(0, 15))
  }, [recentUsers, recentTickets, recentAchievements])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleNotificationClick = (notification: any) => {
    setShowNotifications(false)
    navigate(notification.path)
    // Mark as read
    setNotifications(notifications.map(n => 
      n.id === notification.id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
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
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 h-16 flex items-center justify-between px-6 shadow-sm">
      {/* Left Section - Logo */}
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-primary">Quit Hero Admin</h1>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-2xl mx-8">
          <button
            onClick={() => setShowSearchModal(true)}
            className="w-full flex items-center gap-3 px-4 py-2 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors text-left bg-neutral-50"
          >
            <Search className="w-4 h-4 text-neutral-400" />
            <span className="flex-1 text-sm text-neutral-500">Search users, content, programs...</span>
            <kbd className="text-xs text-neutral-400 border border-neutral-200 rounded px-1.5 py-0.5">
              <Command className="w-3 h-3 inline" />K
          </kbd>
          </button>
      </div>

      {/* Right Section - Notifications & Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowProfileMenu(false)
              }}
            className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors"
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
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-neutral-200 z-50">
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
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-neutral-200">
                      <button 
                        onClick={() => {
                          setShowNotifications(false)
                          navigate('/support/tickets')
                        }}
                        className="text-xs text-primary hover:underline w-full text-center"
                      >
                        View all notifications
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
            className="flex items-center gap-2 p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-medium">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <span className="text-sm font-medium">{user?.name || user?.email}</span>
          </button>
          {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 z-50">
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
    </header>

      {/* Global Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowSearchModal(false)}
          />
          <div className="relative w-full max-w-2xl mx-4 bg-white rounded-lg shadow-2xl border border-neutral-200">
            {/* Search Input */}
            <div className="p-4 border-b border-neutral-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users, content, programs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg"
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
