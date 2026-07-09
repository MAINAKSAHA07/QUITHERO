import { useCallback, useState } from 'react'
import { useApp } from '../context/AppContext'
import { isKycComplete } from '../utils/kyc'

export function useKycGate() {
  const { userProfile, profileLoading } = useApp()
  const [showKycModal, setShowKycModal] = useState(false)

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
