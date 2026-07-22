import { D3MultiLineChart } from './D3EngageCharts'

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
    <D3MultiLineChart
      data={data}
      xKey="date"
      height={300}
      series={[
        { key: 'newUsers', label: 'New Users', color: '#F6B884' },
        { key: 'activeUsers', label: 'Active Users', color: '#3F8DD2' },
        { key: 'churned', label: 'Churned', color: '#E63946' },
      ]}
    />
  )
}
