import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Gift } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { claimGift } from '../services/payment.service'

export default function ClaimGift() {
  const { isAuthenticated, user, fetchUserProfile } = useApp()
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const token = params.get('token') || ''
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    if (!token) {
      setError('This gift link is incomplete. Ask the buyer to resend the invitation.')
      return
    }
    let cancelled = false
    void claimGift(token)
      .then(async () => {
        await fetchUserProfile()
        if (!cancelled) navigate('/subscription-confirmed?gift=1', { replace: true })
      })
      .catch((reason) => {
        if (!cancelled) setError(String(reason?.message || 'Could not claim this gift'))
      })
    return () => {
      cancelled = true
    }
  }, [fetchUserProfile, isAuthenticated, navigate, token, user?.id])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return (
    <main className="min-h-[100dvh] bg-[#F4FBFF] px-6 flex items-center justify-center">
      <section className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-[#3F8DD2]/10 text-[#3F8DD2] flex items-center justify-center">
          <Gift className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0E2538]">Your Smono gift</h1>
        {error ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-red-600" role="alert">{error}</p>
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="mt-6 w-full rounded-2xl bg-[#3F8DD2] px-5 py-3.5 text-sm font-bold text-white active:scale-[0.97] transition-transform"
            >
              Go to home
            </button>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm text-[#0E2538]/60">Unlocking your full 30-day program…</p>
            <div className="mx-auto mt-6 w-7 h-7 rounded-full border-2 border-[#3F8DD2] border-t-transparent animate-spin" />
          </>
        )}
      </section>
    </main>
  )
}
