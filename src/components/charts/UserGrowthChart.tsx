import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface UserGrowthChartProps {
  data: Array<{
    date: string
    newUsers: number
    activeUsers: number
    churned: number
  }>
}

export const UserGrowthChart = ({ data }: UserGrowthChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="newUsers"
          stroke="#F58634"
          strokeWidth={2}
          name="New Users"
        />
        <Line
          type="monotone"
          dataKey="activeUsers"
          stroke="#2A72B5"
          strokeWidth={2}
          name="Active Users"
        />
        <Line
          type="monotone"
          dataKey="churned"
          stroke="#E63946"
          strokeWidth={2}
          name="Churned Users"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}




