import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, Home, Calendar, TrendingUp, BookOpen, User, Heart, Wind, Settings, LogOut, Globe } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { authHelpers } from '../lib/pocketbase'
import GlassCard from './GlassCard'
import TranslatedText from './TranslatedText'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, setIsAuthenticated, setUser } = useApp()

  const menuItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/sessions', icon: Calendar, label: 'Sessions' },
    { path: '/progress', icon: TrendingUp, label: 'Progress' },
    { path: '/journal', icon: BookOpen, label: 'Journal' },
    { path: '/craving', icon: Heart, label: 'Craving Support' },
    { path: '/breathing', icon: Wind, label: 'Breathing Exercise' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]

  const handleNavigate = (path: string) => {
    navigate(path)
    onClose()
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      authHelpers.logout()
      setIsAuthenticated(false)
      setUser(null)
      navigate('/login')
      onClose()
    }
  }

  const isActive = (path: string) => {
    if (path === '/home') return location.pathname === '/home'
    if (path === '/sessions') return location.pathname.startsWith('/session')
    return location.pathname === path
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-full w-80 max-w-[85vw] z-[101]"
          >
            <GlassCard className="h-full w-full !bg-white/90 backdrop-blur-[30px] rounded-none border-r border-white/40 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/30">
                <h2 className="text-xl font-bold text-text-primary">
                  <TranslatedText text="Menu" />
                </h2>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm border border-white/50 flex items-center justify-center hover:bg-white/50 transition-colors"
                >
                  <X className="w-5 h-5 text-text-primary" />
                </button>
              </div>

              {/* User Info */}
              {user && (
                <div className="p-6 border-b border-white/30 bg-white/60">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary truncate">{user.name || 'User'}</p>
                      <p className="text-sm text-text-primary/70 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Menu Items */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.path)
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                        active
                          ? 'bg-brand-primary text-white border border-brand-primary shadow-lg'
                          : 'bg-white/40 backdrop-blur-sm border border-white/50 text-text-primary hover:bg-white/50'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">
                        <TranslatedText text={item.label} />
                      </span>
                    </button>
                  )
                })}
              </nav>

              {/* Footer Actions */}
              <div className="p-4 border-t border-white/30 space-y-2">
                <button
                  onClick={() => {
                    navigate('/language?from=' + location.pathname)
                    onClose()
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-white/40 backdrop-blur-sm border border-white/50 text-text-primary hover:bg-white/50 transition-all"
                >
                  <Globe className="w-5 h-5" />
                  <span className="font-medium">
                    <TranslatedText text="Language" />
                  </span>
                </button>
                <button
                  onClick={() => {
                    handleNavigate('/profile')
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-white/40 backdrop-blur-sm border border-white/50 text-text-primary hover:bg-white/50 transition-all"
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">
                    <TranslatedText text="Settings" />
                  </span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/40 backdrop-blur-sm border border-error/50 text-error hover:bg-error/10 transition-all font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  <TranslatedText text="Logout" />
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
