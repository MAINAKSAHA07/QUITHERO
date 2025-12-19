import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const data = [
  { name: 'Not Started', value: 25, color: '#9ca3af' },
  { name: 'Days 1-3', value: 20, color: '#FFD08A' },
  { name: 'Days 4-7', value: 15, color: '#F58634' },
  { name: 'Days 8-10', value: 10, color: '#D45A1C' },
  { name: 'Completed', value: 30, color: '#4CAF50' },
]

export const ProgramProgressChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}




