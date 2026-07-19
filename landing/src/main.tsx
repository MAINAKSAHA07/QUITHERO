import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/landing.css'
import './styles/responsive.css'
import './styles/blog.css'

function dismissBootLoader() {
  const el = document.getElementById('boot-loader')
  if (!el || el.dataset.dismissed === '1') return
  el.dataset.dismissed = '1'
  el.classList.add('is-done')
  el.setAttribute('aria-busy', 'false')
  el.setAttribute('aria-hidden', 'true')
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.setTimeout(() => el.remove(), reduce ? 0 : 200)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Apple: kill latency — never let the boot veil block the page
const fontsReady = Promise.race([
  document.fonts?.ready ?? Promise.resolve(),
  new Promise<void>((r) => window.setTimeout(r, 280)),
])
const firstPaint = new Promise<void>((r) =>
  requestAnimationFrame(() => requestAnimationFrame(() => r()))
)
Promise.all([fontsReady, firstPaint]).then(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.setTimeout(dismissBootLoader, reduce ? 0 : 80)
})
// Hard failsafe — blog/prerender routes must never stay covered
window.setTimeout(dismissBootLoader, 900)
