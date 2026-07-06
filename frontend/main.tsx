import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// ponytail: SW fights Vite HMR in dev — cache stale bundles and cause constant flicker
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    navigator.serviceWorker.register('/sw.js')
  } else {
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()))
  }
}

