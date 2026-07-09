import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, Plus, Trophy, User } from 'lucide-react'
import { motion } from 'framer-motion'
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

  const activePath = navItems.find((i) => !i.isFAB && isActive(i.path))?.path ?? '/home'
  const activeColor = ACTIVE_COLORS[activePath] ?? '#3F8DD2'
  const activeIndex = navItems.filter((i) => !i.isFAB).findIndex((i) => i.path === activePath)
  // 4 side tabs → slots 0,1,3,4 in a 5-column grid
  const slotIndex = activeIndex <= 1 ? activeIndex : activeIndex + 1
  const dotLeft = `${((slotIndex + 0.5) / 5) * 100}%`

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 safe-area-bottom pointer-events-none"
      aria-label="Main navigation"
    >
      <div className="max-w-md mx-auto pointer-events-auto">
        <div
          className="relative grid grid-cols-5 items-center gap-0 px-1.5 pt-2.5 pb-3.5 rounded-full bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(14,37,56,0.12)] overflow-visible"
          style={{
            border: '1.5px solid transparent',
            backgroundImage:
              'linear-gradient(white, white), linear-gradient(90deg, #3F8DD2, #F6B884, #6EA48F)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
          }}
        >
          {/* Color-pop rail — inset so it doesn't clip the pill edge */}
          <div
            className="absolute bottom-2.5 left-4 right-4 h-[3px] rounded-full opacity-70 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, #3F8DD2, #6EA48F, #F6B884, #6EA48F)',
            }}
            aria-hidden
          />
          <motion.div
            className="absolute bottom-2 w-2 h-2 rounded-full -translate-x-1/2 z-10 pointer-events-none"
            style={{ backgroundColor: activeColor, left: `calc(${dotLeft})` }}
            layout
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            aria-hidden
          />

          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            const color = ACTIVE_COLORS[item.path] ?? '#3F8DD2'

            if (item.isFAB) {
              return (
                <div key={item.path} className="relative flex justify-center items-center h-12">
                  <Link
                    to={item.path}
                    className="absolute left-1/2 -translate-x-1/2 -top-6"
                    aria-label={item.label}
                  >
                    <motion.div
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #F6B884 0%, #E8894A 100%)',
                        boxShadow: '0 6px 20px rgba(246, 184, 132, 0.45), 0 0 0 4px rgba(255,255,255,0.95)',
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.94 }}
                    >
                      <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </motion.div>
                  </Link>
                </div>
              )
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center gap-0.5 h-12 touch-target"
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
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
      </div>
    </nav>
  )
}
