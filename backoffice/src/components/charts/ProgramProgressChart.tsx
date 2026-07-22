import { D3Donut } from './D3EngageCharts'

interface ProgramProgressChartProps {
  data: Array<{
    name: string
    value: number
    color: string
  }>
}

export const ProgramProgressChart = ({ data }: ProgramProgressChartProps) => {
  return (
    <D3Donut
      data={data.map((d) => ({ name: d.name, value: d.value }))}
      height={300}
      colors={data.map((d) => d.color)}
      centerLabel="Sessions"
    />
  )
}
