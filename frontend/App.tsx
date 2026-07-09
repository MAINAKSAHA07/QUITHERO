import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, ReactNode } from 'react'
import SplashScreen from './screens/SplashScreen'
import LanguageSelection from './screens/LanguageSelection'
import Onboarding from './screens/Onboarding'
import Login from './screens/auth/Login'
import SignUp from './screens/auth/SignUp'
import KYCFlow from './screens/kyc/KYCFlow'
import Home from './screens/Home'
import Sessions from './screens/Sessions'
import Session from './screens/Session'
import CravingSupport from './screens/CravingSupport'
import Breathing from './screens/Breathing'
import Progress from './screens/Progress'
import Journal from './screens/Journal'
import Profile from './screens/Profile'
import Paywall from './screens/Paywall'
import ObjectionSurvey from './screens/ObjectionSurvey'
import ObjectionScreen from './screens/ObjectionScreen'
import SubscriptionConfirmation from './screens/SubscriptionConfirmation'
import LegalScreen from './screens/LegalScreen'
import { AppProvider, useApp } from './context/AppContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import InstallPrompt from './components/InstallPrompt'
import { profileService } from './services/profile.service'
import { postAuthPath } from './utils/kyc'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useApp()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RootRedirect() {
  const { isAuthenticated, user } = useApp()
  const [path, setPath] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setPath('/onboarding')
      return
    }
    profileService.getByUserId(user.id).then((result) => {
      setPath(postAuthPath(result.data))
    })
  }, [isAuthenticated, user?.id])

  if (!path) return null
  return <Navigate to={path} replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/language" element={<LanguageSelection />} />
      <Route path="/" element={<RootRedirect />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/terms" element={<LegalScreen initialType="terms" />} />
      <Route path="/privacy" element={<LegalScreen initialType="privacy" />} />
      {/* Protected routes */}
      <Route path="/kyc" element={<ProtectedRoute><KYCFlow /></ProtectedRoute>} />
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
      <Route path="/sessions/:dayId" element={<ProtectedRoute><Session /></ProtectedRoute>} />
      <Route path="/session/:day" element={<ProtectedRoute><Session /></ProtectedRoute>} />
      <Route path="/breathing" element={<ProtectedRoute><Breathing /></ProtectedRoute>} />
      <Route path="/craving" element={<ProtectedRoute><CravingSupport /></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
      <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/paywall" element={<ProtectedRoute><Paywall /></ProtectedRoute>} />
      <Route path="/objection-survey" element={<ProtectedRoute><ObjectionSurvey /></ProtectedRoute>} />
      <Route path="/objection/:key" element={<ProtectedRoute><ObjectionScreen /></ProtectedRoute>} />
      <Route path="/subscription-confirmed" element={<ProtectedRoute><SubscriptionConfirmation /></ProtectedRoute>} />
    </Routes>
  )
}

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user has seen splash before
    const seenSplash = localStorage.getItem('hasSeenSplash')
    if (seenSplash) {
      setIsLoading(false)
    } else {
      // Show splash for 2 seconds
      setTimeout(() => {
        setIsLoading(false)
        localStorage.setItem('hasSeenSplash', 'true')
      }, 2000)
    }
  }, [])

  if (isLoading) {
    return <SplashScreen />
  }

  return (
    <ErrorBoundary>
      <AppProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppRoutes />
          <InstallPrompt />
        </Router>
      </AppProvider>
    </ErrorBoundary>
  )
}

export default App

