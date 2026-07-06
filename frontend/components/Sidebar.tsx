import { createPortal } from 'react-dom'
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

const DRAWER_WIDTH = 'min(18rem, 85%)'

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

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Navigation menu">
          {/* Dim full viewport — no blur seam with drawer edge */}
          <motion.button
            type="button"
            aria-label="Close menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClose}
            className="absolute inset-0 bg-black/45"
          />

          {/* Align drawer to the same max-w-md column as the app shell */}
          <div className="absolute inset-0 flex justify-center pointer-events-none">
            <div className="relative w-full max-w-md h-full">
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: DRAWER_WIDTH }}
                className="absolute left-0 top-0 bottom-0 pointer-events-auto flex flex-col bg-[#f4f8fa] shadow-[4px_0_24px_rgba(15,23,42,0.12)] overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 safe-area-top pb-4 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center">
                      <Flame className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-base font-bold text-text-primary tracking-tight">smono</span>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-9 h-9 rounded-full bg-white border border-black/5 flex items-center justify-center hover:bg-white/90 active:scale-95 transition-transform"
                  >
                    <X className="w-4 h-4 text-text-primary/70" />
                  </button>
                </div>

                {/* User Card */}
                {user && (
                  <div className="mx-4 mb-4 p-4 rounded-2xl bg-white border border-black/5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center overflow-hidden ring-2 ring-white">
                        {user.avatar ? (
                          <img src={`${pb.baseUrl}/api/files/users/${user.id}/${user.avatar}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-text-primary truncate text-sm">{user.name || 'User'}</p>
                        <p className="text-xs text-text-primary/60 truncate">{user.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleNavigate('/profile')}
                        className="w-7 h-7 rounded-full bg-black/[0.04] flex items-center justify-center hover:bg-black/[0.07] transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-text-primary/55" />
                      </button>
                    </div>
                  </div>
                )}

                <p className="px-5 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-text-primary/40">
                  Navigate
                </p>

                <nav className="flex-1 overflow-y-auto overscroll-contain px-4 space-y-0.5 pb-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.path)

                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => handleNavigate(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                          active
                            ? 'bg-brand-primary/12 ring-1 ring-brand-primary/20'
                            : 'hover:bg-black/[0.04]'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          active ? 'bg-brand-primary/20 text-brand-primary' : item.color
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`font-semibold text-sm ${active ? 'text-brand-primary' : 'text-text-primary/80'}`}>
                          <TranslatedText text={item.label} />
                        </span>
                        {active && <ChevronRight className="w-3.5 h-3.5 text-brand-primary ml-auto opacity-70" />}
                      </button>
                    )
                  })}
                </nav>

                <div className="px-4 safe-area-bottom pb-5 pt-3 border-t border-black/5 space-y-0.5 mt-auto">
                  <p className="px-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-text-primary/40">
                    Settings
                  </p>
                  <button
                    type="button"
                    onClick={() => { navigate('/language?from=' + location.pathname); onClose() }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/[0.04] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-400/10 text-teal-600 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm text-text-primary/80">
                      <TranslatedText text="Language" />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/profile')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/[0.04] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-400/10 text-slate-600 flex items-center justify-center flex-shrink-0">
                      <Settings className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm text-text-primary/80">
                      <TranslatedText text="Settings" />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-error/8 hover:bg-error/12 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-error/10 text-error flex items-center justify-center flex-shrink-0">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm text-error">
                      <TranslatedText text="Logout" />
                    </span>
                  </button>
                </div>
              </motion.aside>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
