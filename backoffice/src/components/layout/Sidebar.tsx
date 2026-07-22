import { NavLink, useLocation } from 'react-router-dom'
import { CreditCard, LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  BarChart3,
  Trophy,
  Settings,
  HelpCircle,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Tag,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  path: string
  children?: NavItem[]
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  {
    icon: Users,
    label: 'Users',
    path: '/users',
    children: [
      { icon: Users, label: 'All Users', path: '/users' },
      { icon: Users, label: 'User Segments', path: '/users/segments' },
    ],
  },
  {
    icon: FileText,
    label: 'Content',
    path: '/content',
    children: [
      { icon: FileText, label: 'Programs', path: '/content/programs' },
      { icon: FileText, label: 'Blog & Articles', path: '/content/articles' },
      { icon: FileText, label: 'Quotes & Tips', path: '/content/quotes' },
      { icon: FileText, label: 'Media Library', path: '/content/media' },
    ],
  },
  {
    icon: MessageSquare,
    label: 'Support',
    path: '/support',
    children: [
      { icon: MessageSquare, label: 'Support Tickets', path: '/support/tickets' },
      { icon: MessageSquare, label: 'Account Deletions', path: '/support/account-deletions' },
      { icon: MessageSquare, label: 'Flagged Cravings', path: '/support/flagged-cravings' },
      { icon: MessageSquare, label: 'Flagged Journals', path: '/support/flagged-journals' },
    ],
  },
  {
    icon: BarChart3,
    label: 'Analytics',
    path: '/analytics',
    children: [
      { icon: BarChart3, label: 'User Analytics', path: '/analytics/users' },
      { icon: BarChart3, label: 'Engagement', path: '/analytics/engagement' },
      { icon: BarChart3, label: 'Program Performance', path: '/analytics/programs' },
      { icon: BarChart3, label: 'Retention', path: '/analytics/retention' },
      { icon: CreditCard, label: 'Payments', path: '/analytics/payments' },
      { icon: Tag, label: 'Coupons', path: '/analytics/coupons' },
      { icon: BarChart3, label: 'Custom Reports', path: '/analytics/custom' },
    ],
  },
  {
    icon: Trophy,
    label: 'Achievements',
    path: '/achievements',
    children: [
      { icon: Trophy, label: 'All Achievements', path: '/achievements' },
      { icon: Trophy, label: 'Achievement Logs', path: '/achievements/logs' },
    ],
  },
  {
    icon: Settings,
    label: 'Settings',
    path: '/settings',
    children: [
      { icon: Settings, label: 'App Settings', path: '/settings/app' },
      { icon: Settings, label: 'Templates', path: '/settings/templates' },
      { icon: Settings, label: 'Admin Users', path: '/settings/admins' },
      { icon: Settings, label: 'Roles & Permissions', path: '/settings/roles' },
      { icon: Settings, label: 'Audit Logs', path: '/settings/audit' },
      { icon: Settings, label: 'API Keys', path: '/settings/api' },
    ],
  },
  { icon: HelpCircle, label: 'Help', path: '/help' },
]

function sectionActive(pathname: string, item: NavItem) {
  if (item.path === '/users') return pathname === '/users' || pathname.startsWith('/users/')
  if (item.path === '/achievements') {
    return pathname === '/achievements' || pathname.startsWith('/achievements/')
  }
  return pathname === item.path || pathname.startsWith(`${item.path}/`)
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  // Keep the active section open
  useEffect(() => {
    const active = navItems
      .filter((item) => item.children && sectionActive(location.pathname, item))
      .map((item) => item.path)
    if (active.length) {
      setExpandedItems((prev) => Array.from(new Set([...prev, ...active])))
    }
  }, [location.pathname])

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    )
  }

  return (
    <aside
      className={`shrink-0 h-full flex flex-col bg-[#0E2538] text-white transition-[width] duration-200 ease-out ${
        collapsed ? 'w-16' : 'w-60'
      }`}
      aria-label="Main navigation"
    >
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-0.5">
        {navItems.map((item) => {
          const hasChildren = Boolean(item.children?.length)
          const isExpanded = expandedItems.includes(item.path)
          const isSection = sectionActive(location.pathname, item)
          const Icon = item.icon

          if (!hasChildren) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-100 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  } ${collapsed ? 'justify-center px-0' : ''}`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            )
          }

          return (
            <div key={item.path}>
              <button
                type="button"
                onClick={() => (collapsed ? onToggle() : toggleExpand(item.path))}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-100 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  isSection ? 'bg-white/10 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                aria-expanded={!collapsed && isExpanded}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      className={`w-4 h-4 opacity-70 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </>
                )}
              </button>
              {!collapsed && isExpanded && (
                <div className="mt-0.5 mb-1 ml-3 pl-3 border-l border-white/10 space-y-0.5">
                  {item.children?.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      end={child.path === '/users' || child.path === '/achievements'}
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition-colors duration-100 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                          isActive
                            ? 'bg-primary text-white'
                            : 'text-white/65 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                      <span className="truncate">{child.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="p-2 border-t border-white/10">
        <button
          type="button"
          onClick={onToggle}
          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={`${collapsed ? 'Expand' : 'Collapse'} sidebar (⌘B)`}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <>
              <PanelLeftClose className="w-5 h-5" />
              <span>Collapse</span>
              <kbd className="ml-auto text-[10px] text-white/40 border border-white/15 rounded px-1.5 py-0.5">
                ⌘B
              </kbd>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
