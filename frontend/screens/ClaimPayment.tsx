import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { verifyPayment } from '../services/payment.service'
import { profileService } from '../services/profile.service'

/**
 * Landing checkout lands here after Razorpay success.
 * Requires login; then verifies signature and activates subscription.
 */
export default function ClaimPayment() {
  const { isAuthenticated, user, fetchUserProfile } = useApp()
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)

  const orderId = params.get('razorpay_order_id') || ''
  const paymentId = params.get('razorpay_payment_id') || ''
  const signature = params.get('razorpay_signature') || ''
  const country = (params.get('country') || 'IN').toUpperCase()

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    if (!orderId || !paymentId || !signature) {
      setError('Missing payment details. Start checkout again from the pricing page.')
      setBusy(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        await verifyPayment({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          country,
        })
        await profileService.upsert(user.id, {
          country,
          subscription_country: country,
        })
        await fetchUserProfile()
        if (!cancelled) navigate('/subscription-confirmed', { replace: true })
      } catch (err: any) {
        if (!cancelled) {
          setError(String(err?.message || 'Could not activate your subscription'))
          setBusy(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    isAuthenticated,
    user?.id,
    orderId,
    paymentId,
    signature,
    country,
    fetchUserProfile,
    navigate,
  ])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 gap-4">
      {busy && !error && (
        <p className="text-text-primary/70 text-sm">Confirming your payment…</p>
      )}
      {error && (
        <>
          <p className="text-red-600 text-sm text-center max-w-sm" role="alert">
            {error}
          </p>
          <Link to="/paywall" className="text-sm text-primary underline">
            Try paywall again
          </Link>
        </>
      )}
    </div>
  )
}
