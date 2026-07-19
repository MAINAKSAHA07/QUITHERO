import { useCallback, useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { isKycComplete } from '../utils/kyc'

/**
 * Gate starting sessions until KYC is done.
 * Does NOT auto-popup on Home mount (that raced null profile → stuck modal).
 */
export function useKycGate() {
  const { userProfile, profileLoading } = useApp()
  const [showKycModal, setShowKycModal] = useState(false)

  const kycComplete = isKycComplete(userProfile)

  // Clear modal once profile proves complete (fixes race where modal opened on null profile)
  useEffect(() => {
    if (kycComplete) setShowKycModal(false)
  }, [kycComplete])

  const gateSessionAccess = useCallback(
    (onAllowed: () => void) => {
      if (profileLoading) return
      if (!isKycComplete(userProfile)) {
        setShowKycModal(true)
        return
      }
      onAllowed()
    },
    [userProfile, profileLoading]
  )

  return {
    // While profile is loading, don't treat as incomplete (avoids false KYC redirects)
    kycComplete: profileLoading ? true : kycComplete,
    profileLoading,
    showKycModal,
    setShowKycModal,
    gateSessionAccess,
  }
}
