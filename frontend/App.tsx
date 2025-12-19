import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
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
import { AppProvider } from './context/AppContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import OfflineBanner from './components/OfflineBanner'

function AppRoutes() {
  const location = useLocation()

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/language" element={<LanguageSelection />} />
      <Route path="/" element={<Navigate to="/onboarding" replace />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/kyc" element={<KYCFlow />} />
      <Route path="/home" element={<Home />} />
      <Route path="/sessions" element={<Sessions />} />
      <Route path="/sessions/:dayId" element={<Session />} />
      <Route path="/session/:day" element={<Session />} />
      <Route path="/breathing" element={<Breathing />} />
      <Route path="/craving" element={<CravingSupport />} />
      <Route path="/progress" element={<Progress />} />
      <Route path="/journal" element={<Journal />} />
      <Route path="/profile" element={<Profile />} />
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
        <OfflineBanner />
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppRoutes />
        </Router>
      </AppProvider>
    </ErrorBoundary>
  )
}

export default App

