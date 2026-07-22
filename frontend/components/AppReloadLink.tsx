import { hardReloadApp } from '../utils/swUpdate'

/** Escape hatch for home-screen PWA (no browser chrome / unreliable pull-to-refresh). */
export default function AppReloadLink({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => void hardReloadApp('/')}
      className={`text-sm text-[#4A6574] underline underline-offset-2 active:opacity-70 ${className}`}
    >
      Stuck? Reload app
    </button>
  )
}
