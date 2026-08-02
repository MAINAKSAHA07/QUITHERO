import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { smokeCheckService } from '../services/smoke-check.service'
import { achievementService } from '../services/achievement.service'
import { isPastQuitDay } from '../utils/smokeCheckTiming'
import { formatSlipLifeLost, formatSlipLoss, formatSlipNicotine } from '../utils/slipCost'
import {
  slipMotivationLine,
  slipRecoveryHeadline,
  slipRecoveryName,
} from '../utils/slipRecoveryCopy'
import SmokeCheckModal from './SmokeCheckModal'
import SlipRecovery, { type SlipAchievementPreview } from './SlipRecovery'

type RecoveryState = {
  daysFree: number
  amountLost: string
  nicotine: string
  lifeLost: string
  headline: string
  motivationLine: string
  achievements: SlipAchievementPreview[]
}

async function loadAchievementPreviews(userId: string): Promise<SlipAchievementPreview[]> {
  const result = await achievementService.getUserAchievements(userId)
  if (!result.success || !result.data?.length) return []
  return result.data
    .map((ua: any) => {
      const a = ua.expand?.achievement
      if (!a?.title) return null
      return { title: String(a.title), description: a.description ? String(a.description) : undefined }
    })
    .filter(Boolean) as SlipAchievementPreview[]
}

/** Prompts for 6-hour smoke check-ins when due (in-app + push deep link). */
export default function SmokeCheckGate() {
  const { user, userProfile, refreshProgress, isAuthenticated, currentSession } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [recovery, setRecovery] = useState<RecoveryState | null>(null)
  const quitDate = userProfile?.quit_date
  const onKyc = location.pathname.startsWith('/kyc')

  const evaluateDue = useCallback(async (force = false) => {
    if (!user?.id || !quitDate || !isPastQuitDay(quitDate) || onKyc || recovery) {
      if (!recovery) setOpen(false)
      return
    }
    const unlocked = await smokeCheckService.isUnlocked(user.id, userProfile?.language || 'en')
    if (!unlocked) {
      setOpen(false)
      return
    }
    const due = force || (await smokeCheckService.isDue(user.id, quitDate))
    setOpen(due)
  }, [user?.id, quitDate, onKyc, userProfile?.language, recovery])

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
    if (!isAuthenticated || !user?.id || !quitDate || recovery) return
    const id = window.setInterval(() => void evaluateDue(), 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [isAuthenticated, user?.id, quitDate, evaluateDue, recovery])

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
        const achievements = await loadAchievementPreviews(user.id)
        setRecovery({
          daysFree: totalDays,
          amountLost: formatSlipLoss(1, {
            packCost: userProfile?.pack_cost,
            country: userProfile?.country,
          }),
          nicotine: formatSlipNicotine(1, userProfile?.country),
          lifeLost: formatSlipLifeLost(1),
          headline: slipRecoveryHeadline(slipRecoveryName(userProfile), totalDays),
          motivationLine: slipMotivationLine(userProfile),
          achievements,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  if (recovery) {
    return (
      <div className="fixed inset-0 z-[110] bg-[#F4FBFF] overflow-y-auto">
        <SlipRecovery
          daysFree={recovery.daysFree}
          amountLost={recovery.amountLost}
          nicotineConsumed={recovery.nicotine}
          lifeLost={recovery.lifeLost}
          headline={recovery.headline}
          motivationLine={recovery.motivationLine}
          achievements={recovery.achievements}
          programStarted={(currentSession?.current_day ?? 1) > 1 || recovery.daysFree > 0}
          onDismiss={() => {
            setRecovery(null)
            navigate('/home')
          }}
        />
      </div>
    )
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
