/** Lightweight hero particle ring — no-op cleanup when canvas missing. */
export function initHeroCanvas(): () => void {
  const canvas = document.getElementById('heroCanvas') as HTMLCanvasElement | null
  if (!canvas) return () => {}
  const container = canvas.parentElement
  if (!container) return () => {}

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  let raf = 0
  let alive = true

  const resize = () => {
    const w = container.offsetWidth
    const h = container.offsetHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
  }
  resize()
  window.addEventListener('resize', resize)

  const pts = Array.from({ length: 18 }, (_, k) => ({
    angle: (k / 18) * Math.PI * 2,
    frac: 0.65 + (k % 5) * 0.06,
    size: 1.5 + (k % 3),
    speed: 0.00035 + (k % 4) * 0.0001,
    alpha: 0.35 + (k % 5) * 0.08,
    color: k % 3 === 0 ? '#4A90B2' : k % 3 === 1 ? '#E89255' : '#D47435',
  }))

  const draw = (ts: number) => {
    if (!alive) return
    const W = canvas.width
    const H = canvas.height
    const cx = W / 2
    const cy = H / 2
    const R = Math.min(W, H) * 0.42
    ctx.clearRect(0, 0, W, H)

    const grad = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * 0.9)
    grad.addColorStop(0, 'rgba(139, 205, 232, 0.12)')
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    ctx.fill()

    const prog = 7 / 30
    ctx.beginPath()
    ctx.arc(cx, cy, R * 0.52, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2)
    ctx.strokeStyle = 'rgba(74, 144, 178, 0.5)'
    ctx.lineWidth = 2.5 * dpr
    ctx.stroke()

    pts.forEach((p) => {
      const a = p.angle + ts * p.speed
      const x = cx + Math.cos(a) * R * p.frac
      const y = cy + Math.sin(a) * R * p.frac
      ctx.beginPath()
      ctx.arc(x, y, p.size * dpr, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.alpha
      ctx.fill()
      ctx.globalAlpha = 1
    })

    raf = requestAnimationFrame(draw)
  }
  raf = requestAnimationFrame(draw)

  return () => {
    alive = false
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', resize)
  }
}
