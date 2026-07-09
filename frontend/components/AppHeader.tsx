import { ReactNode, useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import TranslatedText from './TranslatedText'

export const appHeaderBtn =
  'w-10 h-10 rounded-xl bg-white/80 border border-[#3F8DD2]/15 flex items-center justify-center touch-target shadow-sm'

interface AppHeaderProps {
  title: string | ReactNode
  right?: ReactNode
  /** Extra classes on the header row */
  className?: string
}

/** Soft sky header used on main tab screens (menu · title · optional right). */
export default function AppHeader({ title, right, className = '' }: AppHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <header className={`flex items-center justify-between pt-4 pb-4 ${className}`}>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className={appHeaderBtn}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-[#0E2538]/70" />
        </button>
        <div className="flex-1 text-center min-w-0 px-2">
          {typeof title === 'string' ? (
            <h1 className="text-lg font-bold text-[#0E2538] truncate">
              <TranslatedText text={title} />
            </h1>
          ) : (
            title
          )}
        </div>
        <div className="min-w-10 flex-shrink-0 flex items-center justify-end gap-2">
          {right ?? <span className="w-10" aria-hidden />}
        </div>
      </header>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  )
}
