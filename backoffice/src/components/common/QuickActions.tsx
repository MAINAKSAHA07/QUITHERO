import { Plus, FileText, MessageSquare, BarChart3, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const actions = [
  { icon: Plus, label: 'Create New Program', subtitle: 'Add a new program', path: '/content/programs', color: 'bg-primary' },
  { icon: FileText, label: 'Add Content', subtitle: 'Create article or content', path: '/content/articles', color: 'bg-secondary' },
  { icon: MessageSquare, label: 'View Support Queue', subtitle: 'Manage support tickets', path: '/support/tickets', color: 'bg-danger' },
  { icon: BarChart3, label: 'Generate Report', subtitle: 'Create custom report', path: '/analytics/custom', color: 'bg-success' },
  { icon: Settings, label: 'Manage Admins', subtitle: 'Admin user management', path: '/settings/admins', color: 'bg-neutral-dark' },
]

export const QuickActions = () => {
  const navigate = useNavigate()

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <h2 className="text-lg font-semibold tracking-tight mb-4 text-neutral-dark">Quick Actions</h2>
      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.path}
              type="button"
              onClick={() => navigate(action.path)}
              className="w-full flex items-center gap-4 p-3.5 hover:bg-[#F4FBFF] rounded-xl transition-colors text-left border border-[#0E2538]/08 active:scale-[0.99]"
            >
              <div className={`p-2.5 rounded-xl ${action.color} text-white`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-dark">{action.label}</p>
                <p className="text-sm text-neutral-500">{action.subtitle}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
