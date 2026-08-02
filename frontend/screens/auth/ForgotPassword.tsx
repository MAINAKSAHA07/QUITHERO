import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft } from 'lucide-react'
import GlassCard from '../../components/GlassCard'
import GlassButton from '../../components/GlassButton'
import GlassInput from '../../components/GlassInput'
import { authHelpers } from '../../lib/pocketbase'
import { useMotionPrefs } from '../../hooks/useMotionPrefs'
import SmonoLogo from '../../components/SmonoLogo'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const { fade, springUi } = useMotionPrefs()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Enter the email for your account.')
      return
    }
    setLoading(true)
    const result = await authHelpers.requestPasswordReset(trimmed)
    setLoading(false)
    if (!result.success) {
      setError(result.error || 'Could not send reset email.')
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-5 py-10 bg-[#F4FBFF] safe-area-top safe-area-bottom">
      <motion.div {...fade} transition={springUi} className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <SmonoLogo className="h-10" />
        </div>
        <GlassCard className="p-6 sm:p-8" borderGlow={false}>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-[#3F8DD2] font-medium mb-5 active:opacity-70"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          <h1 className="text-2xl font-bold text-[#0E2538] tracking-tight mb-2">
            Reset password
          </h1>
          <p className="text-sm text-[#0E2538]/55 mb-6 leading-relaxed">
            Enter your account email and we&apos;ll send a reset link.
          </p>

          {sent ? (
            <div className="rounded-2xl bg-[#EAF6F1] border border-[#6EA48F]/25 px-4 py-4 text-sm text-[#0E2538]/80 leading-relaxed">
              If an account exists for <span className="font-semibold">{email.trim()}</span>, a
              reset email is on its way. Check spam if you don&apos;t see it in a few minutes.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <GlassInput
                type="email"
                label="Email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-5 h-5" />}
                autoComplete="email"
                required
              />
              {error ? (
                <p className="text-sm text-error" role="alert">
                  {error}
                </p>
              ) : null}
              <GlassButton type="submit" fullWidth className="py-3.5" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </GlassButton>
            </form>
          )}
        </GlassCard>
      </motion.div>
    </div>
  )
}
