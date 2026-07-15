import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { isKycComplete } from '../utils/kyc'
import {
  isAppTourRoute,
  onAppTourRequest,
  shouldAutoShowAppTour,
  touchAppEngagement,
} from '../utils/appTour'
import AppTourModal from './AppTourModal'

/**
 * Spotlight tour for new users and users idle 7+ days.
 * Replay via requestAppTour() from Profile.
 */
export default function AppTourGate() {
  const { isAuthenticated, userProfile } = useApp()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const openRef = useRef(false)
  openRef.current = open

  useEffect(() => {
    return onAppTourRequest(() => setOpen(true))
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setOpen(false)
      return
    }
    if (!isKycComplete(userProfile)) return
    if (!isAppTourRoute(location.pathname)) return
    if (openRef.current) return

    const onHome =
      location.pathname === '/home' || location.pathname.startsWith('/home/')

    if (onHome && shouldAutoShowAppTour()) {
      setOpen(true)
      return
    }

    touchAppEngagement()
  }, [isAuthenticated, userProfile, location.pathname])

  const handleClose = () => {
    setOpen(false)
    touchAppEngagement()
  }

  return <AppTourModal isOpen={open} onClose={handleClose} />
}
