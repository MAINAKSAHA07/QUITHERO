import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

export const ENGAGE_COLORS = ['#3F8DD2', '#F6B884', '#6EA48F', '#8BCDE8', '#E63946', '#0E2538']

/** Inline styles — Tailwind classes on D3-created nodes often don't apply (purge / opacity). */
function attachChartTooltip(parent: HTMLElement) {
  return d3
    .select(parent)
    .append('div')
    .attr('class', 'pointer-events-none absolute z-10')
    .style('opacity', '0')
    .style('padding', '8px 10px')
    .style('border-radius', '12px')
    .style('background', '#0E2538')
    .style('color', '#fff')
    .style('font-size', '12px')
    .style('line-height', '1.45')
    .style('box-shadow', '0 8px 24px rgba(14, 37, 56, 0.25)')
    .style('transform', 'translate(-50%, -120%)')
    .style('white-space', 'nowrap')
}

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

    const tooltip = attachChartTooltip(el)

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
  color = '#3F8DD2',
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

    const tooltip = attachChartTooltip(el)

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
  color = '#3F8DD2',
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

type SeriesDef = { key: string; label: string; color: string }

type MultiLineProps = {
  data: Record<string, string | number>[]
  xKey: string
  series: SeriesDef[]
  height?: number
  yDomain?: [number, number]
  ySuffix?: string
}

/** Multi-series line chart — hover dots + draw-in. */
export function D3MultiLineChart({
  data,
  xKey,
  series,
  height = 300,
  yDomain,
  ySuffix = '',
}: MultiLineProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = ''
    if (!data.length || !series.length) return

    const width = el.clientWidth || 560
    const margin = { top: 16, right: 16, bottom: 36, left: 44 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const yMax =
      yDomain?.[1] ??
      Math.max(1, ...series.flatMap((s) => data.map((d) => Number(d[s.key]) || 0)))
    const yMin = yDomain?.[0] ?? 0

    const svg = d3
      .select(el)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('role', 'img')

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3
      .scalePoint()
      .domain(data.map((d) => String(d[xKey])))
      .range([0, innerW])
      .padding(0.05)

    const y = d3.scaleLinear().domain([yMin, yMax]).nice().range([innerH, 0])

    g.append('g')
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-innerW)
          .tickFormat((d) => `${d}${ySuffix}`)
      )
      .call((s) => s.select('.domain').remove())
      .call((s) => s.selectAll('line').attr('stroke', '#e8eef2').attr('stroke-dasharray', '3 3'))
      .call((s) => s.selectAll('text').attr('fill', '#9ca3af').style('font-size', '11px'))

    const tickEvery = Math.max(1, Math.ceil(data.length / 8))
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(
        d3
          .axisBottom(x)
          .tickSize(0)
          .tickValues(
            data
              .map((d, i) => (i % tickEvery === 0 ? String(d[xKey]) : null))
              .filter(Boolean) as string[]
          )
      )
      .call((s) => s.select('.domain').attr('stroke', '#e5e7eb'))
      .call((s) => s.selectAll('text').attr('fill', '#6b7280').style('font-size', '10px'))

    const tooltip = attachChartTooltip(el)

    const lineGen = (key: string) =>
      d3
        .line<Record<string, string | number>>()
        .x((d) => x(String(d[xKey])) || 0)
        .y((d) => y(Number(d[key]) || 0))
        .curve(d3.curveMonotoneX)

    series.forEach((s) => {
      const path = g
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', s.color)
        .attr('stroke-width', 2.25)
        .attr('stroke-linecap', 'round')
        .attr('d', lineGen(s.key) || '')

      const totalLen = (path.node() as SVGPathElement)?.getTotalLength?.() || 0
      if (totalLen > 0) {
        path
          .attr('stroke-dasharray', `${totalLen} ${totalLen}`)
          .attr('stroke-dashoffset', totalLen)
          .transition()
          .duration(800)
          .ease(d3.easeCubicOut)
          .attr('stroke-dashoffset', 0)
      }

      g.selectAll(`circle.s-${s.key}`)
        .data(data)
        .join('circle')
        .attr('class', `s-${s.key}`)
        .attr('cx', (d) => x(String(d[xKey])) || 0)
        .attr('cy', (d) => y(Number(d[s.key]) || 0))
        .attr('r', 0)
        .attr('fill', s.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseenter', function (event, d) {
          d3.select(this).transition().duration(100).attr('r', 5)
          const rows = series
            .map(
              (ser) =>
                `<div style="color:#fff"><span style="color:${ser.color}">●</span> ${ser.label}: <strong>${d[ser.key]}${ySuffix}</strong></div>`
            )
            .join('')
          tooltip
            .style('opacity', '1')
            .html(
              `<div style="font-weight:600;margin-bottom:4px;color:#fff">${d[xKey]}</div>${rows}`
            )
            .style('left', `${event.offsetX}px`)
            .style('top', `${event.offsetY}px`)
        })
        .on('mousemove', (event) => {
          tooltip.style('left', `${event.offsetX}px`).style('top', `${event.offsetY}px`)
        })
        .on('mouseleave', function () {
          d3.select(this).transition().duration(100).attr('r', 3)
          tooltip.style('opacity', '0')
        })
        .transition()
        .delay(600)
        .duration(200)
        .attr('r', 3)
    })

    const legend = svg.append('g').attr('transform', `translate(${margin.left},${height - 14})`)
    let lx = 0
    series.forEach((s) => {
      const item = legend.append('g').attr('transform', `translate(${lx},0)`)
      item.append('circle').attr('r', 4).attr('cx', 0).attr('cy', -3).attr('fill', s.color)
      item
        .append('text')
        .attr('x', 10)
        .attr('y', 0)
        .attr('fill', '#4A6574')
        .style('font-size', '11px')
        .text(s.label)
      lx += (item.node()?.getBBox().width || 60) + 18
    })

    return () => {
      el.innerHTML = ''
    }
  }, [data, xKey, series, height, yDomain, ySuffix])

  return <div ref={ref} className="relative w-full" style={{ height }} />
}
