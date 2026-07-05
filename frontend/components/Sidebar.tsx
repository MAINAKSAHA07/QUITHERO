import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, Home, Calendar, TrendingUp, BookOpen, User, Heart, Wind, Settings, LogOut, Globe, ChevronRight, Flame } from 'lucide-react'
import { useApp } from '../context/AppContext'
import pb, { authHelpers } from '../lib/pocketbase'
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
    { path: '/home', icon: Home, label: 'Home', color: 'text-brand-primary bg-brand-primary/10' },
    { path: '/sessions', icon: Calendar, label: 'Sessions', color: 'text-violet-500 bg-violet-500/10' },
    { path: '/progress', icon: TrendingUp, label: 'Progress', color: 'text-emerald-500 bg-emerald-500/10' },
    { path: '/journal', icon: BookOpen, label: 'Journal', color: 'text-amber-500 bg-amber-500/10' },
    { path: '/craving', icon: Heart, label: 'Craving Support', color: 'text-rose-400 bg-rose-400/10' },
    { path: '/breathing', icon: Wind, label: 'Breathing', color: 'text-sky-400 bg-sky-400/10' },
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-full w-[300px] max-w-[88vw] z-[101] flex flex-col"
          >
            <div className="h-full w-full bg-gradient-to-b from-[#f4f8fa]/98 to-[#e8f2f8]/98 backdrop-blur-[40px] border-r border-white/50 flex flex-col shadow-2xl">

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-safe pt-6 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center">
                    <Flame className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-base font-bold text-text-primary tracking-tight">smono</span>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-white/60 border border-white/60 flex items-center justify-center hover:bg-white/80 active:scale-95 transition-all shadow-sm"
                >
                  <X className="w-4 h-4 text-text-primary/70" />
                </button>
              </div>

              {/* User Card */}
              {user && (
                <div className="mx-4 mb-4 p-4 rounded-2xl bg-gradient-to-br from-brand-primary/15 to-brand-accent/10 border border-brand-primary/20 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center overflow-hidden shadow-md ring-2 ring-white/60">
                      {user.avatar ? (
                        <img src={`${pb.baseUrl}/api/files/users/${user.id}/${user.avatar}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-text-primary truncate text-sm">{user.name || 'User'}</p>
                      <p className="text-xs text-text-primary/55 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => handleNavigate('/profile')}
                      className="w-7 h-7 rounded-full bg-white/50 border border-white/60 flex items-center justify-center hover:bg-white/70 transition-all"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-text-primary/60" />
                    </button>
                  </div>
                </div>
              )}

              {/* Divider Label */}
              <p className="px-5 pb-1 text-[10px] font-bold uppercase tracking-widest text-text-primary/35">
                Navigate
              </p>

              {/* Menu Items */}
              <nav className="flex-1 overflow-y-auto px-4 space-y-1 pb-2">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.path)

                  return (
                    <motion.button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative ${
                        active
                          ? 'bg-gradient-to-r from-brand-primary/20 to-brand-accent/10 border border-brand-primary/25 shadow-sm'
                          : 'hover:bg-white/50 border border-transparent'
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeBar"
                          className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-gradient-to-b from-brand-primary to-brand-accent"
                        />
                      )}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        active ? 'bg-brand-primary/20 text-brand-primary' : item.color
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`font-semibold text-sm ${active ? 'text-brand-primary' : 'text-text-primary/80'}`}>
                        <TranslatedText text={item.label} />
                      </span>
                      {active && <ChevronRight className="w-3.5 h-3.5 text-brand-primary ml-auto opacity-60" />}
                    </motion.button>
                  )
                })}
              </nav>

              {/* Footer */}
              <div className="px-4 pb-safe pb-6 pt-2 border-t border-white/40 space-y-1 mt-2">
                <p className="px-1 pb-1 text-[10px] font-bold uppercase tracking-widest text-text-primary/35">
                  Settings
                </p>
                <button
                  onClick={() => { navigate('/language?from=' + location.pathname); onClose() }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/50 border border-transparent transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-400/10 text-teal-500 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-sm text-text-primary/80">
                    <TranslatedText text="Language" />
                  </span>
                </button>
                <button
                  onClick={() => handleNavigate('/profile')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/50 border border-transparent transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-400/10 text-slate-500 flex items-center justify-center flex-shrink-0">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-sm text-text-primary/80">
                    <TranslatedText text="Settings" />
                  </span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-error/20 bg-error/5 hover:bg-error/10 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-error/10 text-error flex items-center justify-center flex-shrink-0">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-sm text-error">
                    <TranslatedText text="Logout" />
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
