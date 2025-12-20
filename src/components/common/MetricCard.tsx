import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: number | string
  subtitle?: string
  trend?: string
  trendUp?: boolean
  icon: LucideIcon
  gradient: string
  alert?: 'danger' | 'warning'
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendUp,
  icon: Icon,
  gradient,
  alert,
}) => {
  const alertColors = {
    danger: 'border-danger',
    warning: 'border-warning',
  }

  return (
    <div
      className={`bg-gradient-to-br ${gradient} rounded-lg shadow-card p-6 border ${
        alert ? alertColors[alert] : 'border-transparent'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-white/50`}>
          <Icon className="w-6 h-6 text-primary" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trendUp ? 'text-success' : 'text-danger'}`}>
            <span>{trend}</span>
            {trendUp ? '↑' : '↓'}
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-neutral-dark mb-1">{value.toLocaleString()}</p>
        <p className="text-sm text-neutral-500">{title}</p>
        {subtitle && <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}





