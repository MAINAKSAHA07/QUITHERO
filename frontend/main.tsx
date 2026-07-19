import React from 'react'
import ReactDOM from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Service workers fight Capacitor WKWebView (blank/black screens after nav).
// PWA SW stays for browser prod only.
if ('serviceWorker' in navigator) {
  const isNative = (() => {
    try {
      return Capacitor.isNativePlatform()
    } catch {
      return false
    }
  })()

  if (import.meta.env.PROD && !isNative) {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  } else {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => void r.unregister())
    })
  }
}
