import { useQuery } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// const COLORS = ['#F58634', '#2A72B5', '#4CAF50', '#FFD08A', '#E63946']

export const ProgramPerformance = () => {
  const { data: programsData } = useQuery({
    queryKey: ['programs', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('programs'),
  })

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('user_sessions', {
      expand: 'program',
    }),
  })

  const { data: progressData } = useQuery({
    queryKey: ['session_progress', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('session_progress', {
      expand: 'program_day',
    }),
  })

  const programs = programsData?.data || []
  const sessions = sessionsData?.data || []
  const progress = progressData?.data || []

  const getProgramStats = (programId: string) => {
    const programSessions = sessions.filter((s: any) => s.program === programId)
    const enrolled = programSessions.length
    const active = programSessions.filter((s: any) => s.status === 'in_progress').length
    const completed = programSessions.filter((s: any) => s.status === 'completed').length
    const completionRate = enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0
    
    // Calculate average days to complete
    const completedSessions = programSessions.filter((s: any) => s.status === 'completed')
    const avgDays = completedSessions.length > 0
      ? Math.round(completedSessions.reduce((sum: number, s: any) => {
          if (s.started_at && s.completed_at) {
            const days = Math.floor((new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / (1000 * 60 * 60 * 24))
            return sum + days
          }
          return sum
        }, 0) / completedSessions.length)
      : 0

    // Calculate dropout rate
    const dropoutRate = enrolled > 0 ? Math.round(((enrolled - completed) / enrolled) * 100) : 0

    return { enrolled, active, completed, completionRate, avgDays, dropoutRate }
  }

  const programComparisonData = programs.map((program: any) => {
    const stats = getProgramStats(program.id)
    return {
      name: program.title,
      enrolled: stats.enrolled,
      active: stats.active,
      completionRate: stats.completionRate,
      avgDays: stats.avgDays,
      dropoutRate: stats.dropoutRate,
    }
  })

  // Content Effectiveness - Day completion rates
  const { data: daysData } = useQuery({
    queryKey: ['program_days', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('program_days'),
  })

  const days = daysData?.data || []
  const dayCompletionData = days.map((day: any) => {
    const dayProgress = progress.filter((p: any) => p.program_day === day.id)
    const completed = dayProgress.filter((p: any) => p.status === 'completed').length
    const completionRate = dayProgress.length > 0 ? Math.round((completed / dayProgress.length) * 100) : 0
    
    // Calculate average time spent from progress records
    let avgTimeSpent = 0
    if (dayProgress.length > 0) {
      const timesWithData = dayProgress
        .filter((p: any) => p.time_spent || (p.started_at && p.completed_at))
        .map((p: any) => {
          // If time_spent field exists, use it (in minutes)
          if (p.time_spent) return p.time_spent
          // Otherwise calculate from timestamps
          if (p.started_at && p.completed_at) {
            const diffMs = new Date(p.completed_at).getTime() - new Date(p.started_at).getTime()
            return Math.round(diffMs / (1000 * 60)) // Convert to minutes
          }
          return 0
        })
        .filter((t: number) => t > 0)
      
      if (timesWithData.length > 0) {
        avgTimeSpent = Math.round(timesWithData.reduce((sum: number, t: number) => sum + t, 0) / timesWithData.length)
      }
    }
    
    return {
      day: `Day ${day.day_number}`,
      title: day.title,
      completionRate,
      timeSpent: avgTimeSpent || 0,
    }
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-neutral-dark">Program Performance</h1>

      {/* Program Comparison Table */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold mb-4">Program Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Program Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Enrolled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Completion Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Avg Days to Complete</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Dropout Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {programComparisonData.map((program, idx) => (
                <tr key={idx} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 font-medium">{program.name}</td>
                  <td className="px-6 py-4">{program.enrolled}</td>
                  <td className="px-6 py-4">{program.active}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-neutral-200 rounded-full h-2 max-w-[100px]">
                        <div
                          className="bg-success h-2 rounded-full"
                          style={{ width: `${program.completionRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{program.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{program.avgDays || '-'} days</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${
                      program.dropoutRate > 50 ? 'text-danger' :
                      program.dropoutRate > 30 ? 'text-warning' :
                      'text-success'
                    }`}>
                      {program.dropoutRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Content Effectiveness */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold mb-4">Content Effectiveness by Day</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Day</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Completion Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Avg Time Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Drop-off Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {dayCompletionData.map((day, idx) => (
                <tr key={idx} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 font-medium">{day.day}</td>
                  <td className="px-6 py-4">{day.title}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-neutral-200 rounded-full h-2 max-w-[100px]">
                        <div
                          className={`h-2 rounded-full ${
                            day.completionRate >= 80 ? 'bg-success' :
                            day.completionRate >= 60 ? 'bg-warning' :
                            'bg-danger'
                          }`}
                          style={{ width: `${day.completionRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{day.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{day.timeSpent} min</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${
                      day.completionRate < 60 ? 'text-danger' :
                      day.completionRate < 80 ? 'text-warning' :
                      'text-success'
                    }`}>
                      {100 - day.completionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Completion Rate Chart */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold mb-4">Completion Rate by Day</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dayCompletionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="completionRate" fill="#F58634" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
