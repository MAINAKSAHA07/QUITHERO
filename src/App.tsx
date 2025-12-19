import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { Layout } from './components/layout/Layout'
import { Login } from './pages/auth/Login'
import { Dashboard } from './pages/dashboard/Dashboard'
import { AllUsers } from './pages/users/AllUsers'
import { UserDetail } from './pages/users/UserDetail'
import { UserSegments } from './pages/users/UserSegments'
import { Programs } from './pages/content/Programs'
import { ProgramDays } from './pages/content/ProgramDays'
import { Steps } from './pages/content/Steps'
import { Articles } from './pages/content/Articles'
import { Quotes } from './pages/content/Quotes'
import { MediaLibrary } from './pages/content/MediaLibrary'
import { SupportTickets } from './pages/support/SupportTickets'
import { FlaggedCravings } from './pages/support/FlaggedCravings'
import { FlaggedJournals } from './pages/support/FlaggedJournals'
import { UserAnalytics } from './pages/analytics/UserAnalytics'
import { EngagementMetrics } from './pages/analytics/EngagementMetrics'
import { ProgramPerformance } from './pages/analytics/ProgramPerformance'
import { RetentionReports } from './pages/analytics/RetentionReports'
import { CustomReports } from './pages/analytics/CustomReports'
import { AllAchievements } from './pages/achievements/AllAchievements'
import { AchievementLogs } from './pages/achievements/AchievementLogs'
import { AppSettings } from './pages/settings/AppSettings'
import { NotificationTemplates } from './pages/settings/NotificationTemplates'
import { AdminUsers } from './pages/settings/AdminUsers'
import { RolesPermissions } from './pages/settings/RolesPermissions'
import { AuditLogs } from './pages/settings/AuditLogs'
import { ApiKeys } from './pages/settings/ApiKeys'
import { Help } from './pages/Help'

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AdminAuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    {/* User Management */}
                    <Route path="/users" element={<AllUsers />} />
                    <Route path="/users/:id" element={<UserDetail />} />
                    <Route path="/users/segments" element={<UserSegments />} />
                    
                    {/* Content Management */}
                    <Route path="/content/programs" element={<Programs />} />
                    <Route path="/content/programs/:programId/days" element={<ProgramDays />} />
                    <Route path="/content/programs/:programId/days/:dayId/steps" element={<Steps />} />
                    <Route path="/content/articles" element={<Articles />} />
                    <Route path="/content/quotes" element={<Quotes />} />
                    <Route path="/content/media" element={<MediaLibrary />} />
                    
                    {/* Support & Engagement */}
                    <Route path="/support/tickets" element={<SupportTickets />} />
                    <Route path="/support/flagged-cravings" element={<FlaggedCravings />} />
                    <Route path="/support/flagged-journals" element={<FlaggedJournals />} />
                    
                    {/* Analytics */}
                    <Route path="/analytics/users" element={<UserAnalytics />} />
                    <Route path="/analytics/engagement" element={<EngagementMetrics />} />
                    <Route path="/analytics/programs" element={<ProgramPerformance />} />
                    <Route path="/analytics/retention" element={<RetentionReports />} />
                    <Route path="/analytics/custom" element={<CustomReports />} />
                    
                    {/* Achievements */}
                    <Route path="/achievements" element={<AllAchievements />} />
                    <Route path="/achievements/logs" element={<AchievementLogs />} />
                    
                    {/* Settings */}
                    <Route path="/settings/app" element={<AppSettings />} />
                    <Route path="/settings/templates" element={<NotificationTemplates />} />
                    <Route path="/settings/admins" element={<AdminUsers />} />
                    <Route path="/settings/roles" element={<RolesPermissions />} />
                    <Route path="/settings/audit" element={<AuditLogs />} />
                    <Route path="/settings/api" element={<ApiKeys />} />
                    
                    {/* Help */}
                    <Route path="/help" element={<Help />} />
                    
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  )
}

export default App




