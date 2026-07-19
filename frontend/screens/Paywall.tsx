import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Lock, Shield } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useMotionPrefs } from '../hooks/useMotionPrefs'
import {
  COUNTRIES,
  getSubscriptionPrice,
  getSubscriptionOriginal,
  getPaywallSavingsFrame,
  getCountryConfig,
  detectCountryCode,
  formatMoney,
} from '../utils/currency'
import {
  createOrder,
  loadRazorpayScript,
  previewCoupon,
  verifyPayment,
} from '../services/payment.service'
import { getNativeProductId, shouldUseNativeIap, verifyIapPurchase } from '../services/iap.service'
import { profileService } from '../services/profile.service'

const FEATURES = [
  'All 30 CBT sessions unlocked',
  'AI-personalized content daily',
  'Advanced craving toolkit',
  'Belief tracking & progress delta',
  'Priority support',
]

export default function Paywall() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { userProfile, user, fetchUserProfile } = useApp()
  const { fade, springUi, tap, reduce } = useMotionPrefs()
  const dailyCigs = userProfile?.daily_consumption || 10

  const [country, setCountry] = useState('')
  const [geoReady, setGeoReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [coupon, setCoupon] = useState('')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState<{
    display: string
    original: string
    percent: number
    code: string
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const q = (params.get('country') || '').toUpperCase()
      if (q && COUNTRIES[q]) {
        if (!cancelled) {
          setCountry(q)
          setGeoReady(true)
        }
        return
      }
      const cc = await detectCountryCode()
      if (!cancelled) {
        setCountry(cc)
        setGeoReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [params])

  useEffect(() => {
    setApplied(null)
  }, [country, coupon])

  const billingCountry = country || 'IN'
  const price = getSubscriptionPrice(billingCountry)
  const original = getSubscriptionOriginal(billingCountry)
  const monthlySavings = getPaywallSavingsFrame(billingCountry, dailyCigs)
  const currency = getCountryConfig(billingCountry).currency
  const payLabel = applied?.display || price

  const handleApplyCoupon = async () => {
    if (!geoReady || applying || busy) return
    const code = coupon.trim()
    if (!code) {
      setError('Enter a coupon code')
      return
    }
    setError('')
    setApplying(true)
    try {
      const preview = await previewCoupon(billingCountry, code)
      setApplied({
        code: preview.coupon,
        percent: preview.percent_off,
        display: formatMoney(preview.display_amount, billingCountry),
        original: formatMoney(preview.original_amount, billingCountry),
      })
      setCoupon(preview.coupon)
    } catch (err: any) {
      setApplied(null)
      setError(String(err?.message || 'Invalid coupon'))
    } finally {
      setApplying(false)
    }
  }

  const handleSubscribe = async () => {
    if (!user?.id || busy || !geoReady) return
    setError('')
    setBusy(true)

    try {
      await profileService.upsert(user.id, {
        country: billingCountry,
        subscription_country: billingCountry,
      })

      // Native store builds: StoreKit / Play — never open Razorpay WebView
      if (shouldUseNativeIap()) {
        const productId = getNativeProductId()
        const purchase = (window as unknown as {
          __smonoIapPurchase?: () => Promise<{
            platform: 'ios' | 'android'
            receipt?: string
            purchaseToken?: string
          }>
        }).__smonoIapPurchase

        if (!purchase) {
          throw new Error(
            'In-app purchase is not ready on this build. Update the app or try again after install.'
          )
        }
        const result = await purchase()
        await verifyIapPurchase({
          platform: result.platform,
          productId,
          receipt: result.receipt,
          purchaseToken: result.purchaseToken,
          country: billingCountry,
        })
        await fetchUserProfile()
        navigate('/subscription-confirmed')
        return
      }

      const ready = await loadRazorpayScript()
      if (!ready || !window.Razorpay) {
        throw new Error('Could not load payment checkout. Check your connection and try again.')
      }

      const order = await createOrder(billingCountry, coupon)
      const key = import.meta.env.VITE_RAZORPAY_KEY_ID || order.key_id

      if (order.coupon && order.percent_off && order.display_amount != null) {
        setApplied({
          code: order.coupon,
          percent: order.percent_off,
          display: formatMoney(order.display_amount, billingCountry),
          original: formatMoney(order.original_amount ?? order.display_amount, billingCountry),
        })
      }

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key,
          amount: order.amount,
          currency: order.currency,
          name: 'Smono',
          description: order.coupon
            ? `30-day program · ${order.coupon} (−${order.percent_off}%)`
            : `30-day quit program (${order.currency})`,
          order_id: order.order_id,
          prefill: {
            email: user.email || '',
            name: user.name || '',
            // ponytail: empty contact — Razorpay otherwise prefills merchant/account phone
            contact: '',
          },
          theme: { color: '#3F8DD2' },
          handler: async (response: {
            razorpay_payment_id: string
            razorpay_order_id: string
            razorpay_signature: string
          }) => {
            try {
              await verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                country: order.country,
              })
              await fetchUserProfile()
              resolve()
            } catch (err: any) {
              reject(err)
            }
          },
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled')),
          },
        })

        rzp.on('payment.failed', (resp) => {
          reject(new Error(resp?.error?.description || 'Payment failed'))
        })

        rzp.open()
      })

      navigate('/subscription-confirmed')
    } catch (err: any) {
      const msg = String(err?.message || 'Payment failed')
      if (msg !== 'Payment cancelled') setError(msg)
    } finally {
      setBusy(false)
    }
  }

  const handleSkip = () => {
    navigate('/objection-survey')
  }

  return (
    <div className="min-h-[100dvh] flex flex-col relative bg-[#F4FBFF] overflow-hidden">
      {/* Soft sky wash — same material language as Home */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        style={{
          background:
            'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(139, 205, 232, 0.4), transparent 70%)',
        }}
        aria-hidden
      />

      <motion.div
        {...fade}
        transition={springUi}
        className="relative z-10 flex-1 flex flex-col max-w-md mx-auto w-full px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <header className="text-center pt-4 pb-6">
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#3F8DD2]/80 mb-2">
            Smono Premium
          </p>
          <h1
            className="text-[28px] font-bold text-[#0E2538] tracking-tight leading-[1.15] text-balance"
            style={{ letterSpacing: '-0.02em' }}
          >
            Unlock your full program
          </h1>
          <p className="text-[15px] text-[#0E2538]/55 mt-2 leading-relaxed">
            30 days to freedom — designed around you
          </p>
        </header>

        <div className="rounded-3xl bg-white/80 border border-white shadow-[0_8px_32px_rgba(63,141,210,0.08)] p-5 mb-4">
          <ul className="flex flex-col gap-3.5">
            {FEATURES.map((f, i) => (
              <motion.li
                key={f}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springUi, delay: reduce ? 0 : 0.04 * i }}
                className="flex items-start gap-3 text-[15px] text-[#0E2538]/85 leading-snug"
              >
                <span className="w-6 h-6 rounded-full bg-[#E8F4FC] text-[#3F8DD2] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" strokeWidth={2.75} />
                </span>
                {f}
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-[#E8F4FC]/80 border border-[#3F8DD2]/15 px-4 py-3.5 text-center mb-6">
          <p className="text-[13px] font-semibold text-[#0E2538]">
            You spend ~{monthlySavings}/month on cigarettes
          </p>
          <p className="text-[12px] text-[#0E2538]/50 mt-1">
            This program costs less than 2 days of smoking
          </p>
        </div>

        <div className="text-center mb-6">
          <p className="text-sm text-[#0E2538]/35 line-through tabular-nums">
            {applied?.original || original}
          </p>
          <p
            className="text-[40px] font-bold text-[#0E2538] tabular-nums leading-none mt-1"
            style={{ letterSpacing: '-0.03em' }}
          >
            {geoReady ? payLabel : '…'}
            <span className="text-base font-semibold text-[#0E2538]/45 ml-1 tracking-normal">
              /month
            </span>
          </p>
          {applied && (
            <p className="text-xs font-semibold text-[#3F8DD2] mt-2">
              {applied.code} · {applied.percent}% off
            </p>
          )}
          <p className="text-[12px] text-[#0E2538]/45 mt-2">
            {geoReady ? `Billed in ${currency} · Cancel anytime` : 'Detecting your currency…'}
          </p>
        </div>

        {!shouldUseNativeIap() && (
          <div className="w-full mb-4">
            <label
              htmlFor="paywall-coupon"
              className="block text-[11px] font-semibold tracking-wide uppercase text-[#0E2538]/40 mb-1.5 px-0.5"
            >
              Coupon code
            </label>
            <div className="flex gap-2">
              <input
                id="paywall-coupon"
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleApplyCoupon()
                  }
                }}
                placeholder="Optional"
                autoComplete="off"
                disabled={busy || applying}
                className="flex-1 min-w-0 rounded-2xl border border-[#0E2538]/08 bg-white px-4 py-3.5 text-sm font-semibold tracking-wide text-[#0E2538] placeholder:text-[#0E2538]/25 focus:outline-none focus:ring-2 focus:ring-[#3F8DD2]/25 focus:border-[#3F8DD2]/40"
              />
              <motion.button
                type="button"
                whileTap={tap}
                onClick={handleApplyCoupon}
                disabled={busy || applying || !geoReady || !coupon.trim()}
                className="shrink-0 px-4 py-3.5 rounded-2xl bg-[#0E2538]/06 text-[#0E2538] text-sm font-semibold disabled:opacity-40"
              >
                {applying ? '…' : 'Apply'}
              </motion.button>
            </div>
          </div>
        )}

        {error && (
          <p
            className="w-full text-sm text-[#B42318] text-center bg-[#FEF3F2] border border-[#FECDCA] rounded-2xl px-3 py-2.5 mb-3"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="mt-auto space-y-3 pt-2">
          <motion.button
            type="button"
            whileTap={busy || !geoReady ? undefined : tap}
            onClick={handleSubscribe}
            disabled={busy || !geoReady}
            className="w-full py-4 rounded-2xl text-white font-semibold text-[17px] shadow-[0_8px_24px_rgba(63,141,210,0.35)] disabled:opacity-55 disabled:pointer-events-none disabled:shadow-none"
            style={{
              background: 'linear-gradient(135deg, #3F8DD2 0%, #8BCDE8 55%, #F6B884 140%)',
            }}
          >
            {busy
              ? 'Opening checkout…'
              : !geoReady
                ? 'Detecting currency…'
                : `Continue · ${payLabel}`}
          </motion.button>

          <motion.button
            type="button"
            whileTap={busy ? undefined : tap}
            onClick={handleSkip}
            disabled={busy}
            className="w-full py-3 text-[15px] font-medium text-[#0E2538]/45 hover:text-[#0E2538]/70 disabled:opacity-50"
          >
            Not sure yet? Tell us why
          </motion.button>

          <div className="flex items-center justify-center gap-5 text-[11px] text-[#0E2538]/40 pb-1">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="w-3 h-3" strokeWidth={2.5} /> Secure payment
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Shield className="w-3 h-3" strokeWidth={2.5} /> 30-day guarantee
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
