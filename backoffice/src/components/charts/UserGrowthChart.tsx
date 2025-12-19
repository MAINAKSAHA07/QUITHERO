import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const mockData = [
  { date: 'Jan', newUsers: 120, activeUsers: 100, churned: 20 },
  { date: 'Feb', newUsers: 150, activeUsers: 130, churned: 25 },
  { date: 'Mar', newUsers: 180, activeUsers: 160, churned: 30 },
  { date: 'Apr', newUsers: 200, activeUsers: 180, churned: 35 },
  { date: 'May', newUsers: 220, activeUsers: 200, churned: 40 },
  { date: 'Jun', newUsers: 250, activeUsers: 230, churned: 45 },
]

export const UserGrowthChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={mockData}>
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




