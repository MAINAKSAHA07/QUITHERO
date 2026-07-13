/** Animate showcase/science progress bars when they enter the viewport. */
export function initBarAnimations(): () => void {
  const fills = document.querySelectorAll<HTMLElement>(
    '.mini-bar-fill[data-width], .mini-bar-fill[data-before], .belief-bar-fill[data-before]'
  )
  if (!fills.length) return () => {}

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const timers = new Map<HTMLElement, number>()

  const setFinal = (el: HTMLElement) => {
    const w = el.dataset.width
    const after = el.dataset.after
    if (w != null) {
      el.style.width = `${w}%`
      return
    }
    if (after != null) {
      el.style.width = `${after}%`
      el.style.background = 'var(--secondary)'
      const pct = el.closest('.belief-bar-item')?.querySelector('.belief-bar-pct')
      if (pct) {
        pct.textContent = `${after}%`
        ;(pct as HTMLElement).style.color = 'var(--secondary)'
      }
    }
  }

  const reset = (el: HTMLElement) => {
    const t = timers.get(el)
    if (t) window.clearTimeout(t)
    timers.delete(el)
    el.dataset.animated = '0'
    if (el.dataset.width != null) {
      el.style.width = '0%'
      return
    }
    if (el.dataset.before != null) {
      el.style.width = '0%'
      el.style.background = '#e63946'
      const pct = el.closest('.belief-bar-item')?.querySelector<HTMLElement>('.belief-bar-pct')
      if (pct) {
        pct.textContent = `${el.dataset.before}%`
        pct.style.color = '#e63946'
      }
    }
  }

  const play = (el: HTMLElement) => {
    if (el.dataset.animated === '1') return
    el.dataset.animated = '1'

    const w = el.dataset.width
    const before = el.dataset.before
    const after = el.dataset.after

    if (w != null) {
      el.style.width = '0%'
      void el.offsetWidth
      el.style.width = `${w}%`
      return
    }

    if (before == null || after == null) return

    el.style.width = '0%'
    void el.offsetWidth
    el.style.width = `${before}%`
    el.style.background = '#e63946'
    const pct = el.closest('.belief-bar-item')?.querySelector<HTMLElement>('.belief-bar-pct')
    if (pct) {
      pct.textContent = `${before}%`
      pct.style.color = '#e63946'
    }

    const id = window.setTimeout(() => {
      el.style.width = `${after}%`
      el.style.background = 'var(--secondary)'
      if (pct) {
        pct.textContent = `${after}%`
        pct.style.color = 'var(--secondary)'
      }
    }, 550)
    timers.set(el, id)
  }

  if (reduced) {
    fills.forEach(setFinal)
    return () => {}
  }

  fills.forEach(reset)

  const roots = new Set<Element>()
  fills.forEach((el) => {
    roots.add(el.closest('.phone, .belief-panel, .showcase-row, .science-visual') || el)
  })

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const root = entry.target
        const kids = [...fills].filter((el) => root.contains(el) || root === el)
        if (entry.isIntersecting) {
          kids.forEach((el, i) => {
            window.setTimeout(() => play(el), i * 70)
          })
        } else {
          kids.forEach(reset)
        }
      })
    },
    { threshold: 0.25, rootMargin: '0px 0px -8% 0px' }
  )

  roots.forEach((root) => observer.observe(root))

  return () => {
    observer.disconnect()
    timers.forEach((id) => window.clearTimeout(id))
  }
}
