import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, Plus, Trophy, User } from 'lucide-react'
import TranslatedText from './TranslatedText'

const ACTIVE_COLORS: Record<string, string> = {
  '/home': '#3F8DD2',
  '/sessions': '#6EA48F',
  '/progress': '#F6B884',
  '/profile': '#3F8DD2',
}

export default function BottomNavigation() {
  const location = useLocation()

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/sessions', icon: Calendar, label: 'Sessions' },
    { path: '/craving', icon: Plus, label: 'Support', isFAB: true },
    { path: '/progress', icon: Trophy, label: 'Progress' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]

  const isActive = (path: string) => {
    if (path === '/home') return location.pathname === '/home'
    if (path === '/sessions') return location.pathname.startsWith('/session')
    return location.pathname === path
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto safe-area-bottom bg-white border-t border-[#0E2538]/10 shadow-[0_-4px_20px_rgba(14,37,56,0.06)] rounded-t-3xl"
      aria-label="Main navigation"
    >
      <div className="relative grid grid-cols-5 items-center gap-0 px-2 pt-2 pb-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          const color = ACTIVE_COLORS[item.path] ?? '#3F8DD2'

          if (item.isFAB) {
            return (
              <div key={item.path} className="relative flex justify-center items-center h-12">
                <Link
                  to={item.path}
                  className="absolute left-1/2 -translate-x-1/2 -top-5"
                  aria-label={item.label}
                  data-tour-id="craving"
                >
                  {/* Press feedback only — no hover scale on high-frequency nav */}
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-100 ease-out active:scale-[0.97]"
                    style={{
                      background: 'linear-gradient(135deg, #F6B884 0%, #E8894A 100%)',
                      boxShadow: '0 6px 20px rgba(246, 184, 132, 0.4)',
                    }}
                  >
                    <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                </Link>
              </div>
            )
          }

          const tourId =
            item.path === '/home'
              ? 'home'
              : item.path === '/sessions'
                ? 'sessions'
                : item.path === '/progress'
                  ? 'progress'
                  : item.path === '/profile'
                    ? 'profile'
                    : undefined

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center gap-0.5 h-12 touch-target transition-transform duration-100 ease-out active:scale-[0.97]"
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              data-tour-id={tourId}
            >
              <Icon
                strokeWidth={active ? 2.5 : 1.75}
                className="w-5 h-5 transition-colors duration-200"
                style={{ color: active ? color : 'rgba(14, 37, 56, 0.4)' }}
              />
              <span
                className="text-[10px] font-semibold leading-none transition-colors duration-200"
                style={{ color: active ? color : 'rgba(14, 37, 56, 0.4)' }}
              >
                <TranslatedText text={item.label} />
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
