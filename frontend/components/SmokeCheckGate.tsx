import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { smokeCheckService } from '../services/smoke-check.service'
import { isPastQuitDay } from '../utils/smokeCheckTiming'
import SmokeCheckModal from './SmokeCheckModal'

/** Prompts for 6-hour smoke check-ins when due (in-app + push deep link). */
export default function SmokeCheckGate() {
  const { user, userProfile, refreshProgress, isAuthenticated } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const quitDate = userProfile?.quit_date
  const onKyc = location.pathname.startsWith('/kyc')

  const evaluateDue = useCallback(async (force = false) => {
    if (!user?.id || !quitDate || !isPastQuitDay(quitDate) || onKyc) {
      setOpen(false)
      return
    }
    const unlocked = await smokeCheckService.isUnlocked(user.id, userProfile?.language || 'en')
    if (!unlocked) {
      setOpen(false)
      return
    }
    const due = force || (await smokeCheckService.isDue(user.id, quitDate))
    setOpen(due)
  }, [user?.id, quitDate, onKyc, userProfile?.language])

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    const params = new URLSearchParams(location.search)
    const fromPush = params.get('smoke_check') === '1'
    if (fromPush) {
      params.delete('smoke_check')
      const next = params.toString()
      navigate({ pathname: location.pathname, search: next ? `?${next}` : '' }, { replace: true })
    }
    void evaluateDue(fromPush)
  }, [isAuthenticated, user?.id, location.search, location.pathname, navigate, evaluateDue])

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !quitDate) return
    const id = window.setInterval(() => void evaluateDue(), 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [isAuthenticated, user?.id, quitDate, evaluateDue])

  const submit = async (smoked: boolean) => {
    if (!user?.id || !quitDate) return
    setLoading(true)
    try {
      const result = await smokeCheckService.submit(user.id, quitDate, smoked, 'in_app')
      if (!result.success) {
        console.error('[SmokeCheck] save failed:', result.error)
        const detail = import.meta.env.DEV && result.error ? `\n\n${result.error}` : ''
        alert(`Could not save your check-in. Please try again.${detail}`)
        return
      }
      setOpen(false)
      await refreshProgress()
      if (smoked) {
        const progress = await smokeCheckService.getAggregatedStats(user.id)
        const totalDays = progress.success ? Math.floor(progress.data.totalDays) : 0
        if (totalDays > 0) {
          alert(
            `Logged. One slip doesn't erase your progress — you still have ${totalDays} day${totalDays === 1 ? '' : 's'} of confirmed smoke-free time saved.`
          )
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <SmokeCheckModal
      open={open}
      loading={loading}
      onStillFree={() => submit(false)}
      onSmoked={() => submit(true)}
    />
  )
}
