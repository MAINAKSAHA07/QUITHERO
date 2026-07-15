import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

export const ENGAGE_COLORS = ['#F58634', '#2A72B5', '#4CAF50', '#FFD08A', '#E63946', '#7C9EB2']

type Slice = { name: string; value: number }

type DonutProps = {
  data: Slice[]
  height?: number
  colors?: string[]
  centerLabel?: string
}

/** Animated donut with hover emphasis + center total. */
export function D3Donut({
  data,
  height = 280,
  colors = ENGAGE_COLORS,
  centerLabel = 'Total',
}: DonutProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = ''
    const width = el.clientWidth || 320
    const radius = Math.min(width, height) / 2 - 8
    const total = d3.sum(data, (d) => d.value) || 1

    const svg = d3
      .select(el)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('role', 'img')

    const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`)

    const pie = d3
      .pie<Slice>()
      .value((d) => d.value)
      .sort(null)
      .padAngle(0.02)

    const arc = d3
      .arc<d3.PieArcDatum<Slice>>()
      .innerRadius(radius * 0.58)
      .outerRadius(radius * 0.92)
      .cornerRadius(6)

    const arcHover = d3
      .arc<d3.PieArcDatum<Slice>>()
      .innerRadius(radius * 0.55)
      .outerRadius(radius * 0.98)
      .cornerRadius(8)

    const color = d3.scaleOrdinal<string>().domain(data.map((d) => d.name)).range(colors)

    const tooltip = d3
      .select(el)
      .append('div')
      .attr(
        'class',
        'pointer-events-none absolute z-10 rounded-lg bg-neutral-900/90 px-2.5 py-1.5 text-xs text-white opacity-0 transition-opacity'
      )
      .style('transform', 'translate(-50%, -120%)')

    const paths = g
      .selectAll('path')
      .data(pie(data))
      .join('path')
      .attr('fill', (d) => color(d.data.name))
      .attr('d', arc)
      .style('cursor', 'pointer')
      .attr('opacity', 0)

    paths
      .transition()
      .duration(700)
      .delay((_, i) => i * 60)
      .attr('opacity', 1)
      .attrTween('d', function (d) {
        const i = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d)
        return (t) => arc(i(t)) || ''
      })

    paths
      .on('mouseenter', function (event, d) {
        d3.select(this).transition().duration(180).attr('d', arcHover(d) || null)
        const pct = Math.round((d.data.value / total) * 100)
        tooltip
          .style('opacity', '1')
          .html(`<strong>${d.data.name}</strong><br/>${d.data.value} · ${pct}%`)
          .style('left', `${event.offsetX}px`)
          .style('top', `${event.offsetY}px`)
      })
      .on('mousemove', function (event) {
        tooltip.style('left', `${event.offsetX}px`).style('top', `${event.offsetY}px`)
      })
      .on('mouseleave', function (_, d) {
        d3.select(this).transition().duration(180).attr('d', arc(d) || null)
        tooltip.style('opacity', '0')
      })

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('class', 'fill-neutral-800')
      .style('font-size', '22px')
      .style('font-weight', '700')
      .text(d3.format(',')(total))

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .attr('class', 'fill-neutral-500')
      .style('font-size', '11px')
      .text(centerLabel)

    return () => {
      el.innerHTML = ''
    }
  }, [data, height, colors, centerLabel])

  return <div ref={ref} className="relative w-full" style={{ height }} />
}

type BarPoint = { label: string; value: number }

type BarProps = {
  data: BarPoint[]
  height?: number
  color?: string
  max?: number
  valueSuffix?: string
  rounded?: boolean
}

/** Vertical bars with gradient fill + grow animation. */
export function D3ColumnChart({
  data,
  height = 300,
  color = '#F58634',
  max,
  valueSuffix = '',
  rounded = true,
}: BarProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = ''
    const width = el.clientWidth || 480
    const margin = { top: 16, right: 12, bottom: 40, left: 40 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom
    const yMax = max ?? Math.max(1, d3.max(data, (d) => d.value) || 0)

    const svg = d3
      .select(el)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerW])
      .padding(0.28)

    const y = d3.scaleLinear().domain([0, yMax]).nice().range([innerH, 0])

    const defs = svg.append('defs')
    const grad = defs
      .append('linearGradient')
      .attr('id', `bar-grad-${color.replace('#', '')}`)
      .attr('x1', '0')
      .attr('x2', '0')
      .attr('y1', '0')
      .attr('y2', '1')
    grad.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 1)
    grad.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0.55)

    g.append('g')
      .attr('class', 'text-neutral-400')
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-innerW)
          .tickFormat((d) => `${d}${valueSuffix}`)
      )
      .call((s) => s.select('.domain').remove())
      .call((s) => s.selectAll('line').attr('stroke', '#e5e7eb').attr('stroke-dasharray', '3 3'))
      .call((s) => s.selectAll('text').attr('fill', '#9ca3af').style('font-size', '11px'))

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call((s) => s.select('.domain').attr('stroke', '#e5e7eb'))
      .call((s) =>
        s
          .selectAll('text')
          .attr('fill', '#6b7280')
          .style('font-size', '10px')
          .attr('transform', data.length > 12 ? 'rotate(-35)' : null)
          .style('text-anchor', data.length > 12 ? 'end' : 'middle')
      )

    const tooltip = d3
      .select(el)
      .append('div')
      .attr(
        'class',
        'pointer-events-none absolute z-10 rounded-lg bg-neutral-900/90 px-2.5 py-1.5 text-xs text-white opacity-0'
      )

    g.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', (d) => x(d.label) || 0)
      .attr('width', x.bandwidth())
      .attr('y', innerH)
      .attr('height', 0)
      .attr('rx', rounded ? 6 : 0)
      .attr('fill', `url(#bar-grad-${color.replace('#', '')})`)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('opacity', 0.85)
        tooltip
          .style('opacity', '1')
          .html(`<strong>${d.label}</strong><br/>${d.value}${valueSuffix}`)
          .style('left', `${event.offsetX}px`)
          .style('top', `${event.offsetY}px`)
      })
      .on('mousemove', (event) => {
        tooltip.style('left', `${event.offsetX}px`).style('top', `${event.offsetY}px`)
      })
      .on('mouseleave', function () {
        d3.select(this).attr('opacity', 1)
        tooltip.style('opacity', '0')
      })
      .transition()
      .duration(750)
      .delay((_, i) => i * 35)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => y(d.value))
      .attr('height', (d) => Math.max(0, innerH - y(d.value)))

    return () => {
      el.innerHTML = ''
    }
  }, [data, height, color, max, valueSuffix, rounded])

  return <div ref={ref} className="relative w-full" style={{ height }} />
}

/** Horizontal ranking bars. */
export function D3HorizontalBars({
  data,
  height = 280,
  color = '#F58634',
}: {
  data: BarPoint[]
  height?: number
  color?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = ''
    const width = el.clientWidth || 400
    const margin = { top: 8, right: 36, bottom: 8, left: 110 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom
    const xMax = Math.max(1, d3.max(data, (d) => d.value) || 0)

    const svg = d3
      .select(el)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerH])
      .padding(0.22)

    const x = d3.scaleLinear().domain([0, xMax]).nice().range([0, innerW])

    g.append('g')
      .call(d3.axisLeft(y).tickSize(0))
      .call((s) => s.select('.domain').remove())
      .call((s) =>
        s
          .selectAll('text')
          .attr('fill', '#4b5563')
          .style('font-size', '11px')
          .each(function (label) {
            const text = String(label)
            if (text.length > 16) d3.select(this).text(`${text.slice(0, 15)}…`)
          })
      )

    g.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('y', (d) => y(d.label) || 0)
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('width', 0)
      .attr('rx', 5)
      .attr('fill', color)
      .attr('opacity', 0.9)
      .transition()
      .duration(700)
      .delay((_, i) => i * 40)
      .ease(d3.easeCubicOut)
      .attr('width', (d) => x(d.value))

    g.selectAll('text.value')
      .data(data)
      .join('text')
      .attr('class', 'value')
      .attr('x', (d) => x(d.value) + 6)
      .attr('y', (d) => (y(d.label) || 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', '#6b7280')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .attr('opacity', 0)
      .text((d) => d.value)
      .transition()
      .delay(500)
      .attr('opacity', 1)

    return () => {
      el.innerHTML = ''
    }
  }, [data, height, color])

  return <div ref={ref} className="relative w-full" style={{ height }} />
}
