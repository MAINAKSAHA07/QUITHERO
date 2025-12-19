import { Clock, LucideIcon } from 'lucide-react'

interface Activity {
  type: string
  message: string
  time: string
  icon: LucideIcon
  color: string
}

interface ActivityFeedProps {
  activities?: Activity[]
}

export const ActivityFeed = ({ activities = [] }: ActivityFeedProps) => {
  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <p className="text-neutral-500 text-center py-8">No recent activity</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activity.icon
          return (
            <div key={index} className="flex items-start gap-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors">
              <div className={`p-2 rounded-lg ${activity.color.replace('text-', 'bg-')}/10`}>
                <Icon className={`w-4 h-4 ${activity.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-dark">{activity.message}</p>
                <div className="flex items-center gap-1 text-xs text-neutral-500 mt-1">
                  <Clock className="w-3 h-3" />
                  {activity.time}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <button className="mt-4 text-sm text-primary hover:underline">
        View all activity →
      </button>
    </div>
  )
}
