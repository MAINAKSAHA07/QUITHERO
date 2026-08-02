import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff } from 'lucide-react'
import GlassCard from '../../components/GlassCard'
import GlassButton from '../../components/GlassButton'
import GlassInput from '../../components/GlassInput'
import { authHelpers } from '../../lib/pocketbase'
import { useMotionPrefs } from '../../hooks/useMotionPrefs'
import SmonoLogo from '../../components/SmonoLogo'

export default function ConfirmPasswordReset() {
  const [params] = useSearchParams()
  const token = useMemo(() => {
    // Support ?token=… and /confirm-password-reset/:token path via search only for SPA simplicity
    return (params.get('token') || '').trim()
  }, [params])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()
  const { fade, springUi } = useMotionPrefs()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!token) {
      setError('Reset link is missing or expired. Request a new one.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const result = await authHelpers.confirmPasswordReset(token, password, confirm)
    setLoading(false)
    if (!result.success) {
      setError(result.error || 'Could not reset password.')
      return
    }
    setDone(true)
    window.setTimeout(() => navigate('/login', { replace: true }), 1500)
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-5 py-10 bg-[#F4FBFF] safe-area-top safe-area-bottom">
      <motion.div {...fade} transition={springUi} className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <SmonoLogo className="h-10" />
        </div>
        <GlassCard className="p-6 sm:p-8" borderGlow={false}>
          <h1 className="text-2xl font-bold text-[#0E2538] tracking-tight mb-2">
            Choose a new password
          </h1>
          <p className="text-sm text-[#0E2538]/55 mb-6 leading-relaxed">
            Pick something memorable — at least 8 characters.
          </p>

          {!token ? (
            <div className="space-y-4">
              <p className="text-sm text-error" role="alert">
                This reset link is invalid. Request a new email from the login screen.
              </p>
              <Link to="/forgot-password" className="text-sm font-medium text-[#3F8DD2]">
                Request a new link
              </Link>
            </div>
          ) : done ? (
            <p className="text-sm text-[#0E2538]/75">Password updated. Taking you to login…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <GlassInput
                type={show ? 'text' : 'password'}
                label="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-5 h-5" />}
                autoComplete="new-password"
                required
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                  >
                    {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
              />
              <GlassInput
                type={show ? 'text' : 'password'}
                label="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                icon={<Lock className="w-5 h-5" />}
                autoComplete="new-password"
                required
              />
              {error ? (
                <p className="text-sm text-error" role="alert">
                  {error}
                </p>
              ) : null}
              <GlassButton type="submit" fullWidth className="py-3.5" disabled={loading}>
                {loading ? 'Saving…' : 'Update password'}
              </GlassButton>
            </form>
          )}
        </GlassCard>
      </motion.div>
    </div>
  )
}
