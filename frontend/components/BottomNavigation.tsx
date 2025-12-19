import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, Plus, Ticket, User } from 'lucide-react'
import { motion } from 'framer-motion'

export default function BottomNavigation() {
  const location = useLocation()

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/sessions', icon: Calendar, label: 'Sessions' },
    { path: '/craving', icon: Plus, label: 'Support', isFAB: true },
    { path: '/progress', icon: Ticket, label: 'Progress' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]

  const isActive = (path: string) => {
    if (path === '/home') return location.pathname === '/home'
    if (path === '/sessions') return location.pathname.startsWith('/session')
    return location.pathname === path
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-white/30">
      <div className="max-w-md mx-auto flex items-center justify-around px-4 py-3 safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)

          if (item.isFAB) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative -mt-8"
              >
                <motion.div
                  className="w-16 h-16 rounded-full glass-button-primary flex items-center justify-center shadow-glass-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    boxShadow: active
                      ? [
                          '0 0 20px rgba(245, 134, 52, 0.3)',
                          '0 0 30px rgba(245, 134, 52, 0.5)',
                          '0 0 20px rgba(245, 134, 52, 0.3)',
                        ]
                      : '0 0 20px rgba(245, 134, 52, 0.3)',
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </motion.div>
              </Link>
            )
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-1 flex-1"
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    active ? 'text-brand-primary' : 'text-text-primary/50'
                  }`}
                />
                {active && (
                  <motion.div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-primary"
                    layoutId="activeIndicator"
                    initial={false}
                  />
                )}
              </div>
              <span
                className={`text-xs transition-colors ${
                  active ? 'text-brand-primary font-medium' : 'text-text-primary/50'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

