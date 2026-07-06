import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts'

const CHART_MARGIN = { top: 8, right: 4, left: -18, bottom: 0 }

const tooltipStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid rgba(0, 0, 0, 0.06)',
  borderRadius: '10px',
  fontSize: '12px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
}

const axisTick = { fill: 'rgba(43, 43, 43, 0.55)', fontSize: 11 }

export interface ChartPoint {
  day: string
  cravings: number
  date?: string
}

export interface TriggerSlice {
  name: string
  value: number
  color: string
}

export function CravingTrendChart({
  data,
  variant,
}: {
  data: ChartPoint[]
  variant: 'week' | 'month' | 'all'
}) {
  if (data.length === 0) return null

  if (variant === 'week') {
    return (
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="day" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={28} />
            <Tooltip
              cursor={{ fill: 'rgba(245, 134, 52, 0.08)' }}
              contentStyle={tooltipStyle}
              formatter={(value: number) => [value, 'Cravings']}
            />
            <Bar dataKey="cravings" fill="#F58634" radius={[6, 6, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ ...CHART_MARGIN, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
          <XAxis
            dataKey="day"
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={28} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value, 'Cravings']} />
          <Line
            type="monotone"
            dataKey="cravings"
            stroke="#F58634"
            strokeWidth={2.5}
            dot={{ fill: '#F58634', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#D45A1C' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TriggerBreakdownChart({ data }: { data: TriggerSlice[] }) {
  if (data.length === 0) return null

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [value, name]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full grid grid-cols-2 gap-2">
        {data.map((slice) => (
          <div key={slice.name} className="flex items-center gap-2 min-w-0 px-2 py-1.5 rounded-lg bg-black/[0.03]">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }} />
            <span className="text-xs text-text-primary/80 truncate flex-1">{slice.name}</span>
            <span className="text-xs font-bold text-text-primary tabular-nums">
              {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[200px] text-center px-4">
      <p className="text-sm text-text-primary/50">{message}</p>
    </div>
  )
}

export function ChartLoadingState() {
  return (
    <div className="flex items-center justify-center h-[200px]">
      <div className="w-8 h-8 rounded-full border-2 border-brand-primary/20 border-t-brand-primary animate-spin" />
    </div>
  )
}
