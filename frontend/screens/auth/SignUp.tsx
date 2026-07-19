import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, Check } from 'lucide-react'
import SmonoLogo from '../../components/SmonoLogo'
import GlassCard from '../../components/GlassCard'
import GlassButton from '../../components/GlassButton'
import GlassInput from '../../components/GlassInput'
import AuthModeTabs from '../../components/AuthModeTabs'
import LanguageModal from '../../components/LanguageModal'
import { useApp } from '../../context/AppContext'
import { useMotionPrefs } from '../../hooks/useMotionPrefs'
import { authHelpers, mapAuthRecordToAppUser } from '../../lib/pocketbase'
import { analyticsService } from '../../services/analytics.service'
import { profileService } from '../../services/profile.service'
import { postAuthPath } from '../../utils/kyc'
import { hasChosenLanguage, markLanguageChosen } from '../../utils/languageChoice'

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [didSubmit, setDidSubmit] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user, setIsAuthenticated, setUser } = useApp()
  const { fade, springUi } = useMotionPrefs()
  const returnFrom = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from
  const goAfterAuth = async (userId: string) => {
    if (
      returnFrom?.pathname &&
      returnFrom.pathname !== '/login' &&
      returnFrom.pathname !== '/signup' &&
      returnFrom.pathname !== '/onboarding'
    ) {
      navigate(`${returnFrom.pathname}${returnFrom.search || ''}`, { replace: true })
      return
    }
    const profileResult = await profileService.getByUserId(userId)
    navigate(postAuthPath(profileResult.data), { replace: true })
  }

  // If user lands here already authenticated (e.g. after OAuth redirect), route them
  useEffect(() => {
    if (!isAuthenticated || !user?.id || didSubmit) return
    goAfterAuth(user.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount / auth only
  }, [isAuthenticated, user?.id, navigate, didSubmit])

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' }
    // PocketBase users.password min is 8
    if (password.length < 8) return { strength: 1, label: 'Too short', color: 'bg-error' }
    if (password.length < 12) return { strength: 2, label: 'Medium', color: 'bg-brand-light' }
    return { strength: 3, label: 'Strong', color: 'bg-success' }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (!acceptedTerms) {
      setError('Please accept the terms and conditions')
      setLoading(false)
      return
    }

    try {
      const result = await authHelpers.register(
        formData.email,
        formData.password,
        { name: formData.name }
      )

      if (result.success && result.data) {
        setDidSubmit(true)
        setIsAuthenticated(true)
        const mapped = mapAuthRecordToAppUser(result.data.record as Record<string, unknown>)
        if (mapped) setUser(mapped)
        // Track registration
        await analyticsService.trackEvent('user_registered', {
          email: formData.email,
          name: formData.name,
        }, result.data.record.id)

        // Language once at start — skip if already chosen (e.g. /language before signup)
        if (hasChosenLanguage()) {
          await goAfterAuth(result.data.record.id)
        } else {
          setShowLanguageModal(true)
        }
      } else {
        setError(result.error || 'Registration failed. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await authHelpers.loginWithGoogle()
      if (result.redirecting) return
      if (result.success && result.data) {
        setDidSubmit(true)
        const record = result.data.record
        setIsAuthenticated(true)
        const mapped = mapAuthRecordToAppUser(record as Record<string, unknown>)
        if (mapped) setUser(mapped)
        await analyticsService.trackEvent('user_registered', { method: 'google' }, record.id)

        if (hasChosenLanguage()) {
          await goAfterAuth(record.id)
        } else {
          setShowLanguageModal(true)
        }
      } else {
        setError(result.error || 'Google sign up failed')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google sign up')
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
            <p className="text-[#0E2538]/55 mt-1 text-[15px]">Create your account</p>
          </div>

          <AuthModeTabs mode="signup" />

          <GlassCard className="p-6 mb-6" borderGlow={false}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <GlassInput
                type="text"
                label="Name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                icon={<User className="w-5 h-5" />}
                autoComplete="name"
                autoCapitalize="words"
              />

              <GlassInput
                type="email"
                label="Email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                icon={<Mail className="w-5 h-5" />}
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
              />

              <GlassInput
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                icon={<Lock className="w-5 h-5" />}
                autoComplete="new-password"
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

              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#0E2538]/55">Password strength</span>
                    <span className={`text-xs font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-[#0E2538]/08">
                    <motion.div
                      className={`h-full ${passwordStrength.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(passwordStrength.strength / 3) * 100}%` }}
                      transition={springUi}
                    />
                  </div>
                </div>
              )}

              <GlassInput
                type={showConfirmPassword ? 'text' : 'password'}
                label="Confirm Password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                icon={<Lock className="w-5 h-5" />}
                autoComplete="new-password"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="active:scale-95 transition-transform duration-100"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                }
              />

              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setAcceptedTerms(!acceptedTerms)}
                  className={`mt-1 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-100 active:scale-95 ${
                    acceptedTerms
                      ? 'bg-[#3F8DD2] border-2 border-[#3F8DD2]'
                      : 'bg-white border-2 border-[#0E2538]/20'
                  }`}
                  aria-pressed={acceptedTerms}
                >
                  {acceptedTerms && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </button>
                <label
                  className="text-sm text-[#0E2538]/60 cursor-pointer"
                  onClick={() => setAcceptedTerms(!acceptedTerms)}
                >
                  I agree to the{' '}
                  <a
                    href="https://www.smono.app/terms/"
                    className="text-[#3F8DD2] font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms & Conditions
                  </a>{' '}
                  and{' '}
                  <a
                    href="https://www.smono.app/privacy/"
                    className="text-[#3F8DD2] font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>

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
                disabled={loading}
              >
                {loading ? 'Creating account…' : 'Create account'}
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
              onClick={handleGoogleSignUp}
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </GlassButton>
          </div>
        </motion.div>
      </div>

      <LanguageModal
        isOpen={showLanguageModal}
        onClose={() => {
          setShowLanguageModal(false)
          if (user?.id) void goAfterAuth(user.id)
          else navigate('/kyc')
        }}
        onLanguageSelected={(lang) => {
          markLanguageChosen(lang)
          setShowLanguageModal(false)
          if (user?.id) void goAfterAuth(user.id)
          else navigate('/kyc')
        }}
        showSkip={false}
      />
    </div>
  )
}

