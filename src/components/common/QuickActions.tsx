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
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className="w-full flex items-center gap-4 p-4 hover:bg-neutral-50 rounded-lg transition-colors text-left border border-neutral-200"
            >
              <div className={`p-3 rounded-lg ${action.color} text-white`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
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




