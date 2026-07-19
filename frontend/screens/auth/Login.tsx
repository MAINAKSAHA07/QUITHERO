import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import GlassCard from '../../components/GlassCard'
import GlassButton from '../../components/GlassButton'
import GlassInput from '../../components/GlassInput'
import AuthModeTabs from '../../components/AuthModeTabs'
import { useApp } from '../../context/AppContext'
import { useMotionPrefs } from '../../hooks/useMotionPrefs'
import { authHelpers, mapAuthRecordToAppUser } from '../../lib/pocketbase'
import { analyticsService } from '../../services/analytics.service'
import SmonoLogo from '../../components/SmonoLogo'
import { profileService } from '../../services/profile.service'
import { postAuthPath } from '../../utils/kyc'
import {
  getLoginLockout,
  recordLoginFailure,
  recordLoginSuccess,
  getLoginRetryDelayMs,
  formatLockoutDuration,
  LOGIN_MAX_ATTEMPTS,
  isReturningLoginUser,
  markReturningLoginUser,
} from '../../utils/loginRateLimit'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lockoutRetryMs, setLockoutRetryMs] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user, setIsAuthenticated, setUser } = useApp()
  const { fade, springUi } = useMotionPrefs()

  const refreshLockout = useCallback(() => {
    if (!email.trim()) {
      setLockoutRetryMs(0)
      return
    }
    const { locked, retryAfterMs } = getLoginLockout(email)
    setLockoutRetryMs(locked ? retryAfterMs : 0)
  }, [email])

  useEffect(() => {
    refreshLockout()
  }, [refreshLockout])

  useEffect(() => {
    if (lockoutRetryMs <= 0) return
    const timer = setInterval(refreshLockout, 1000)
    return () => clearInterval(timer)
  }, [lockoutRetryMs, refreshLockout])

  const isLockedOut = lockoutRetryMs > 0
  const fromState = location.state as { from?: { pathname?: string; search?: string }; isNew?: boolean } | null
  // First-timers (and post-onboarding) get "Welcome"; only prior logins get "Welcome Back"
  const showWelcomeBack = !fromState?.isNew && isReturningLoginUser()

  // Already signed in (refresh race / OAuth) — return to prior page when we have one
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    const from = fromState?.from
    if (from?.pathname && from.pathname !== '/login' && from.pathname !== '/signup' && from.pathname !== '/onboarding') {
      navigate(`${from.pathname}${from.search || ''}`, { replace: true })
      return
    }
    let cancelled = false
    profileService
      .getByUserId(user.id)
      .then((result) => {
        if (!cancelled) navigate(postAuthPath(result.data), { replace: true })
      })
      .catch(() => {
        if (!cancelled) navigate('/home', { replace: true })
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user?.id, navigate, fromState])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    const lockout = getLoginLockout(email)
    if (lockout.locked) {
      setLockoutRetryMs(lockout.retryAfterMs)
      setError(`Too many failed attempts. Try again in ${formatLockoutDuration(lockout.retryAfterMs)}.`)
      return
    }

    setLoading(true)

    try {
      if (lockout.failures > 0) {
        await sleep(getLoginRetryDelayMs(lockout.failures))
      }

      const result = await authHelpers.login(email, password)
      
      if (result.success && result.data) {
        recordLoginSuccess(email)
        markReturningLoginUser()
        setIsAuthenticated(true)
        const mapped = mapAuthRecordToAppUser(result.data.record as Record<string, unknown>)
        if (mapped) setUser(mapped)
        // Track login
        await analyticsService.trackEvent('login', {}, result.data.record.id)

        // Check if user has completed onboarding — honor return path from protected route
        const from = fromState?.from
        if (from?.pathname && from.pathname !== '/login' && from.pathname !== '/signup' && from.pathname !== '/onboarding') {
          navigate(`${from.pathname}${from.search || ''}`, { replace: true })
        } else {
          const profileResult = await profileService.getByUserId(result.data.record.id)
          navigate(postAuthPath(profileResult.data), { replace: true })
        }
      } else {
        const failure = recordLoginFailure(email)
        refreshLockout()
        if (failure.locked) {
          setError(`Too many failed attempts. Try again in ${formatLockoutDuration(failure.retryAfterMs)}.`)
        } else if (failure.attemptsRemaining <= 2) {
          setError(
            `${result.error || 'Login failed. Please check your credentials.'} (${failure.attemptsRemaining} attempt${failure.attemptsRemaining === 1 ? '' : 's'} left)`
          )
        } else {
          setError(result.error || 'Login failed. Please check your credentials.')
        }
      }
    } catch (err: any) {
      const failure = recordLoginFailure(email)
      refreshLockout()
      if (failure.locked) {
        setError(`Too many failed attempts. Try again in ${formatLockoutDuration(failure.retryAfterMs)}.`)
      } else {
        setError(err.message || 'An error occurred during login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await authHelpers.loginWithGoogle()
      if (result.redirecting) return
      if (result.success && result.data) {
        const record = result.data.record
        markReturningLoginUser()
        setIsAuthenticated(true)
        const mapped = mapAuthRecordToAppUser(record as Record<string, unknown>)
        if (mapped) setUser(mapped)
        // Track login
        await analyticsService.trackEvent('login', { method: 'google' }, record.id)

        const from = fromState?.from
        if (from?.pathname && from.pathname !== '/login' && from.pathname !== '/signup' && from.pathname !== '/onboarding') {
          navigate(`${from.pathname}${from.search || ''}`, { replace: true })
        } else {
          const profileResult = await profileService.getByUserId(record.id)
          navigate(postAuthPath(profileResult.data), { replace: true })
        }
      } else {
        setError(result.error || 'Google login failed')
      }
    } catch (err: any) {
      setError(err.message || 'Google login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleAppleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await authHelpers.loginWithApple()
      if (result.redirecting) return
      if (result.success && result.data) {
        const record = result.data.record
        markReturningLoginUser()
        setIsAuthenticated(true)
        const mapped = mapAuthRecordToAppUser(record as Record<string, unknown>)
        if (mapped) setUser(mapped)
        await analyticsService.trackEvent('login', { method: 'apple' }, record.id)

        const from = fromState?.from
        if (from?.pathname && from.pathname !== '/login' && from.pathname !== '/signup' && from.pathname !== '/onboarding') {
          navigate(`${from.pathname}${from.search || ''}`, { replace: true })
        } else {
          const profileResult = await profileService.getByUserId(record.id)
          navigate(postAuthPath(profileResult.data), { replace: true })
        }
      } else {
        setError(result.error || 'Apple login failed')
      }
    } catch (err: any) {
      setError(err.message || 'Apple login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-[#F4FBFF] pb-20 safe-area-bottom safe-area-top">
      <div className="app-container px-3 sm:px-4 pt-8">
        <motion.div {...fade} transition={springUi}>
          <div className="text-center mb-6 flex flex-col items-center">
            <SmonoLogo size="lg" showMascot className="mb-2" />
            <p className="text-[#0E2538]/55 mt-1 text-[15px]">
              {showWelcomeBack ? 'Welcome back' : 'Welcome'}
            </p>
          </div>

          <AuthModeTabs mode="login" />

          <GlassCard className="p-6 mb-6" borderGlow={false}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <GlassInput
                type="email"
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-5 h-5" />}
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
              />

              <GlassInput
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-5 h-5" />}
                autoComplete="current-password"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="active:scale-95 transition-transform duration-100"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                }
              />

              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-[#3F8DD2] font-medium active:opacity-70"
                >
                  Forgot Password?
                </Link>
              </div>

              {isLockedOut && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  Login paused for {formatLockoutDuration(lockoutRetryMs)} after {LOGIN_MAX_ATTEMPTS} failed attempts.
                </p>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-error"
                  role="alert"
                >
                  {error}
                </motion.p>
              )}

              <GlassButton
                type="submit"
                fullWidth
                className="py-4 text-lg mt-6"
                disabled={loading || isLockedOut}
              >
                {isLockedOut
                  ? `Try again in ${formatLockoutDuration(lockoutRetryMs)}`
                  : loading
                    ? 'Logging in…'
                    : 'Log in'}
              </GlassButton>
            </form>
          </GlassCard>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-[#0E2538]/10" />
              <span className="text-xs text-[#0E2538]/40">or</span>
              <div className="flex-1 h-px bg-[#0E2538]/10" />
            </div>
            <GlassButton
              variant="secondary"
              fullWidth
              className="py-3 flex items-center justify-center gap-2"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </GlassButton>

            <GlassButton
              variant="secondary"
              fullWidth
              className="py-3 flex items-center justify-center gap-2"
              onClick={handleAppleLogin}
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.96-3.24-1.5-1.84-.78-2.9-1.22-3.24-2.02-.3-.7-.19-1.73.1-2.78l.93-3.2c.05-.2-.02-.4-.16-.54L5.5 9.5c-.3-.3-.4-.7-.25-1.1.15-.4.5-.7.9-.8 1.5-.3 2.9-.6 3.9-1.1.5-.3 1-.6 1.5-1 .5-.4.9-.8 1.3-1.2.3-.3.6-.5 1-.6.4-.1.8-.1 1.2 0 .4.1.7.3 1 .6.4.4.8.8 1.3 1.2.5.4 1 .7 1.5 1 1 .5 2.4.8 3.9 1.1.4.1.75.4.9.8.15.4.05.8-.25 1.1l-2.12 2.06c-.14.14-.21.34-.16.54l.93 3.2c.29 1.05.4 2.08.1 2.78-.34.8-1.4 1.24-3.24 2.02-1.16.54-2.15 1-3.24 1.5-1.03.48-2.1.55-3.08-.4z" />
              </svg>
              Continue with Apple
            </GlassButton>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

