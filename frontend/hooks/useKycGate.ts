import { useCallback, useState } from 'react'
import { useApp } from '../context/AppContext'
import { isKycComplete } from '../utils/kyc'

export function useKycGate() {
  const { userProfile, profileLoading } = useApp()
  const [showKycModal, setShowKycModal] = useState(false)
  const kycComplete = isKycComplete(userProfile)

  const gateSessionAccess = useCallback(
    (onAllowed: () => void) => {
      if (profileLoading) return
      if (!kycComplete) {
        setShowKycModal(true)
        return
      }
      onAllowed()
    },
    [kycComplete, profileLoading]
  )

  return { kycComplete, profileLoading, showKycModal, setShowKycModal, gateSessionAccess }
}
