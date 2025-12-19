import { ReactNode, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Menu, Bell, Search, MoreVertical } from 'lucide-react'
import Sidebar from './Sidebar'

interface TopNavigationProps {
  left?: 'back' | 'menu' | 'logo' | ReactNode
  center?: string | ReactNode
  right?: 'search' | 'notifications' | 'menu' | 'login' | ReactNode
  showGlass?: boolean
}

export default function TopNavigation({
  left = 'menu',
  center,
  right = 'notifications',
  showGlass = true,
}: TopNavigationProps) {
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const renderLeft = () => {
    if (left === 'back') {
      return (
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full glass flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>
      )
    }
    if (left === 'menu') {
      return (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <Menu className="w-5 h-5 text-text-primary" />
        </button>
      )
    }
    if (left === 'logo') {
      return (
        <div className="text-xl font-bold text-gradient">Quit Hero</div>
      )
    }
    return left
  }

  const renderRight = () => {
    if (right === 'search') {
      return (
        <button className="w-10 h-10 rounded-full glass flex items-center justify-center">
          <Search className="w-5 h-5 text-text-primary" />
        </button>
      )
    }
    if (right === 'notifications') {
      return (
        <button className="relative w-10 h-10 rounded-full glass flex items-center justify-center">
          <Bell className="w-5 h-5 text-text-primary" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
        </button>
      )
    }
    if (right === 'menu') {
      return (
        <button className="w-10 h-10 rounded-full glass flex items-center justify-center">
          <MoreVertical className="w-5 h-5 text-text-primary" />
        </button>
      )
    }
    if (right === 'login') {
      return (
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 glass-button-secondary text-sm"
        >
          Login
        </button>
      )
    }
    return right
  }

  return (
    <>
      <nav
        className={`sticky top-0 z-40 ${
          showGlass ? 'glass-strong border-b border-white/30' : ''
        }`}
      >
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex-1 flex items-center">{renderLeft()}</div>
          <div className="flex-1 text-center">
            {typeof center === 'string' ? (
              <h1 className="text-lg font-semibold text-text-primary truncate">{center}</h1>
            ) : (
              center
            )}
          </div>
          <div className="flex-1 flex justify-end items-center">{renderRight()}</div>
        </div>
      </nav>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  )
}

