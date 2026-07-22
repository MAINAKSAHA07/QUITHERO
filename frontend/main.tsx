import React from 'react'
import ReactDOM from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './utils/swUpdate'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Service workers fight Capacitor WKWebView (blank/black screens after nav).
// PWA SW stays for browser / home-screen prod only.
if ('serviceWorker' in navigator) {
  const isNative = (() => {
    try {
      return Capacitor.isNativePlatform()
    } catch {
      return false
    }
  })()

  if (import.meta.env.PROD && !isNative) {
    registerServiceWorker()
  } else {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => void r.unregister())
    })
  }
}
