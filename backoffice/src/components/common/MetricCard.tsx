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
      className={`bg-gradient-to-br ${gradient} rounded-2xl shadow-card p-6 border active:scale-[0.99] transition-transform duration-100 ${
        alert ? alertColors[alert] : 'border-white/40'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-white/60 backdrop-blur-sm">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trendUp ? 'text-success' : 'text-danger'}`}>
            <span>{trend}</span>
            {trendUp ? '↑' : '↓'}
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-neutral-dark tracking-tight mb-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-sm text-[#4A6574] font-medium">{title}</p>
        {subtitle && <p className="text-xs text-[#4A6574]/80 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
