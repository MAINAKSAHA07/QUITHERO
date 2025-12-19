import { ReactNode, useState } from 'react'
import { TopNav } from './TopNav'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-bg-default">
      <TopNav />
      <div className="flex">
        <Sidebar onCollapseChange={setSidebarCollapsed} />
        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} p-6`}>
          {children}
        </main>
      </div>
    </div>
  )
}




