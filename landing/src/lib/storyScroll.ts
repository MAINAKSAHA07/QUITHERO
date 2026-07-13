type Dot = { x: number; y: number }
type StoryCfg = {
  dots: Dot[]
  conns?: number[][]
  broken?: number[][]
  center?: boolean
}

const STORY_CFGS: StoryCfg[] = [
  {
    dots: [
      { x: 0.3, y: 0.3 },
      { x: 0.7, y: 0.2 },
      { x: 0.5, y: 0.5 },
      { x: 0.2, y: 0.7 },
      { x: 0.8, y: 0.6 },
      { x: 0.6, y: 0.8 },
      { x: 0.4, y: 0.15 },
      { x: 0.85, y: 0.4 },
    ],
    conns: [],
  },
  {
    dots: [
      { x: 0.3, y: 0.3 },
      { x: 0.7, y: 0.2 },
      { x: 0.5, y: 0.5 },
      { x: 0.2, y: 0.7 },
      { x: 0.8, y: 0.6 },
      { x: 0.6, y: 0.8 },
      { x: 0.4, y: 0.15 },
      { x: 0.85, y: 0.4 },
    ],
    conns: [
      [0, 2],
      [1, 2],
      [2, 3],
      [2, 4],
      [3, 5],
      [4, 5],
      [0, 6],
      [4, 7],
    ],
  },
  {
    dots: [
      { x: 0.3, y: 0.3 },
      { x: 0.7, y: 0.2 },
      { x: 0.5, y: 0.5 },
      { x: 0.2, y: 0.7 },
      { x: 0.8, y: 0.6 },
      { x: 0.6, y: 0.8 },
      { x: 0.4, y: 0.15 },
      { x: 0.85, y: 0.4 },
    ],
    conns: [
      [0, 2],
      [2, 3],
      [3, 5],
    ],
    broken: [
      [1, 2],
      [2, 4],
      [4, 5],
      [0, 6],
      [4, 7],
    ],
  },
  {
    dots: Array.from({ length: 8 }, (_, k) => ({
      x: 0.5 + Math.cos((k / 8) * Math.PI * 2) * 0.35,
      y: 0.5 + Math.sin((k / 8) * Math.PI * 2) * 0.3,
    })),
    conns: Array.from({ length: 8 }, (_, k) => [k, (k + 1) % 8]),
    center: true,
  },
]

const STEP_LABELS = ['Understand', 'Break', 'Prepare', 'Stay Free']

/** Draw journey network graphic + sync timeline steps on scroll. */
export function initStoryScroll(): () => void {
  const canvas = document.getElementById('storyCanvas') as HTMLCanvasElement | null
  const content = document.querySelector<HTMLElement>('.story-scroll-content')
  const steps = document.querySelectorAll<HTMLElement>('.story-step')
  const progress = document.getElementById('timelineProgress')
  const label = document.getElementById('storyCanvasLabel')
  if (!steps.length) return () => {}

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let cur = 0
  let dpr = Math.min(window.devicePixelRatio || 1, 2)
  let ctx: CanvasRenderingContext2D | null = null
  let ticking = false

  const draw = (step: number) => {
    if (!canvas || !ctx) return
    const g = ctx
    const W = canvas.width
    const H = canvas.height
    const cfg = STORY_CFGS[step - 1]
    if (!cfg || !W || !H) return

    g.clearRect(0, 0, W, H)
    g.fillStyle = 'rgba(139, 205, 232, 0.12)'
    for (let gx = 0; gx < W; gx += 22 * dpr) {
      for (let gy = 0; gy < H; gy += 22 * dpr) {
        g.beginPath()
        g.arc(gx, gy, dpr, 0, Math.PI * 2)
        g.fill()
      }
    }

    ;(cfg.conns || []).forEach(([a, b]) => {
      const pa = cfg.dots[a]
      const pb = cfg.dots[b]
      if (!pa || !pb) return
      g.beginPath()
      g.moveTo(pa.x * W, pa.y * H)
      g.lineTo(pb.x * W, pb.y * H)
      g.strokeStyle = step === 4 ? 'rgba(232,146,85,0.4)' : 'rgba(74,144,178,0.3)'
      g.lineWidth = 1.5 * dpr
      g.setLineDash([])
      g.stroke()
    })

    ;(cfg.broken || []).forEach(([a, b]) => {
      const pa = cfg.dots[a]
      const pb = cfg.dots[b]
      if (!pa || !pb) return
      g.beginPath()
      g.moveTo(pa.x * W, pa.y * H)
      g.lineTo(pb.x * W, pb.y * H)
      g.strokeStyle = 'rgba(230, 57, 70, 0.25)'
      g.lineWidth = 1 * dpr
      g.setLineDash([4 * dpr, 6 * dpr])
      g.stroke()
      g.setLineDash([])
    })

    if (cfg.center) {
      const rad = g.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.2)
      rad.addColorStop(0, 'rgba(232, 146, 85, 0.15)')
      rad.addColorStop(1, 'transparent')
      g.fillStyle = rad
      g.beginPath()
      g.arc(W * 0.5, H * 0.5, W * 0.2, 0, Math.PI * 2)
      g.fill()
    }

    cfg.dots.forEach((d, k) => {
      const x = d.x * W
      const y = d.y * H
      const c = step === 4 ? '#E89255' : k % 3 === 0 ? '#4A90B2' : k % 3 === 1 ? '#E89255' : '#D47435'
      g.beginPath()
      g.arc(x, y, 5 * dpr, 0, Math.PI * 2)
      g.fillStyle = c
      g.globalAlpha = 0.85
      g.fill()
      g.beginPath()
      g.arc(x, y, 9 * dpr, 0, Math.PI * 2)
      g.fillStyle = c
      g.globalAlpha = 0.12
      g.fill()
      g.globalAlpha = 1
    })
  }

  const setStep = (n: number) => {
    if (n < 1 || n > steps.length || n === cur) return
    cur = n
    steps.forEach((s) => s.classList.remove('active'))
    steps[n - 1]?.classList.add('active')
    if (label) label.textContent = `Phase ${n} · ${STEP_LABELS[n - 1] || ''}`
    draw(n)
  }

  const syncFromScroll = () => {
    const headerH =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 100
    const sticky = document.querySelector<HTMLElement>('.story-sticky-visual')
    const stickyBox = sticky?.getBoundingClientRect()
    // Focus just under the stuck canvas so the active copy is readable
    const focusY =
      stickyBox && stickyBox.bottom > headerH
        ? Math.min(window.innerHeight * 0.62, stickyBox.bottom + 28)
        : window.innerHeight * 0.42

    let best = 1
    let bestDist = Infinity
    steps.forEach((el, i) => {
      const r = el.getBoundingClientRect()
      // Score against the heading area (badge + title), not the tall step box center
      const mid = r.top + Math.min(72, r.height * 0.2)
      const dist = Math.abs(mid - focusY)
      if (dist < bestDist) {
        bestDist = dist
        best = i + 1
      }
    })
    setStep(best)

    if (progress && content) {
      const first = steps[0].getBoundingClientRect()
      const last = steps[steps.length - 1].getBoundingClientRect()
      const span = last.bottom - first.top
      const traveled = focusY - first.top
      const pct = span > 0 ? Math.min(100, Math.max(0, (traveled / span) * 100)) : 0
      progress.style.height = `${pct}%`
    }
  }

  const onScroll = () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      syncFromScroll()
      ticking = false
    })
  }

  const resize = () => {
    if (!canvas?.parentElement) return
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    const r = canvas.parentElement.getBoundingClientRect()
    const w = Math.max(1, Math.floor(r.width))
    const h = Math.max(1, Math.floor(r.height))
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx = canvas.getContext('2d')
    if (cur) draw(cur)
    else {
      cur = 1
      draw(1)
    }
    syncFromScroll()
  }

  if (canvas && !reduced) {
    ctx = canvas.getContext('2d')
    resize()
    window.addEventListener('resize', resize)
  } else if (canvas) {
    canvas.style.display = 'none'
  }

  // body is often the scrollport (overflow:auto) — listen on both
  const scrollOpts: AddEventListenerOptions = { passive: true, capture: true }
  window.addEventListener('scroll', onScroll, scrollOpts)
  document.addEventListener('scroll', onScroll, scrollOpts)
  syncFromScroll()

  return () => {
    window.removeEventListener('scroll', onScroll, scrollOpts)
    document.removeEventListener('scroll', onScroll, scrollOpts)
    window.removeEventListener('resize', resize)
  }
}
