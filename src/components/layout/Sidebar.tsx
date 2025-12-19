import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  BarChart3,
  Trophy,
  Settings,
  HelpCircle,
  ChevronLeft,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  path: string
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/dashboard',
  },
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
      { icon: FileText, label: 'Articles', path: '/content/articles' },
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
  {
    icon: HelpCircle,
    label: 'Help',
    path: '/help',
  },
]

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ onCollapseChange }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleCollapse = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    onCollapseChange?.(newCollapsed)
  }

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    )
  }

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-neutral-dark text-white transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } overflow-y-auto`}
    >
      <nav className="p-4">
        {navItems.map((item) => {
          const hasChildren = item.children && item.children.length > 0
          const isExpanded = expandedItems.includes(item.path)
          const Icon = item.icon

          return (
            <div key={item.path} className="mb-1">
              {hasChildren ? (
                <>
                  <button
                    onClick={() => toggleExpand(item.path)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                    {!collapsed && (
                      <ChevronLeft
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    )}
                  </button>
                  {!collapsed && isExpanded && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children?.map((child) => {
                        const ChildIcon = child.icon
                        return (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                isActive
                                  ? 'bg-primary text-white'
                                  : 'hover:bg-white/10 text-white/80'
                              }`
                            }
                          >
                            <ChildIcon className="w-4 h-4" />
                            <span>{child.label}</span>
                          </NavLink>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'hover:bg-white/10 text-white/80'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              )}
            </div>
          )
        })}
      </nav>
      <button
        onClick={toggleCollapse}
        className="absolute bottom-4 left-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
      >
        <ChevronLeft
          className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
        />
      </button>
    </aside>
  )
}




