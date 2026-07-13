import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/landing.css'
import './styles/responsive.css'

function dismissBootLoader() {
  const el = document.getElementById('boot-loader')
  if (!el) return
  el.classList.add('is-done')
  el.setAttribute('aria-busy', 'false')
  window.setTimeout(() => el.remove(), 500)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Wait for first paint + fonts so the page doesn’t flash under the loader
const ready = Promise.all([
  document.fonts?.ready ?? Promise.resolve(),
  new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
])
ready.then(() => {
  // ponytail: short beat so the mascot is readable on fast loads
  window.setTimeout(dismissBootLoader, 320)
})
