import { useCallback, useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { isKycComplete } from '../utils/kyc'

export function useKycGate() {
  const { userProfile, profileLoading } = useApp()
  const [showKycModal, setShowKycModal] = useState(false)

  useEffect(() => {
    if (!profileLoading && !isKycComplete(userProfile)) {
      setShowKycModal(true)
    }
  }, [profileLoading, userProfile])

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
    kycComplete: profileLoading ? true : isKycComplete(userProfile),
    profileLoading,
    showKycModal,
    setShowKycModal,
    gateSessionAccess,
  }
}
