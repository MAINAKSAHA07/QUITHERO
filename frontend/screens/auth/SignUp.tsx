import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, Check } from 'lucide-react'
import TopNavigation from '../../components/TopNavigation'
import GlassCard from '../../components/GlassCard'
import GlassButton from '../../components/GlassButton'
import GlassInput from '../../components/GlassInput'
import LanguageModal from '../../components/LanguageModal'
import { useApp } from '../../context/AppContext'
import { authHelpers } from '../../lib/pocketbase'
import { analyticsService } from '../../services/analytics.service'
import { profileService } from '../../services/profile.service'

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
  const { isAuthenticated, user, setIsAuthenticated, setUser } = useApp()

  // If user lands here already authenticated (e.g. after OAuth redirect), route them
  useEffect(() => {
    if (!isAuthenticated || !user?.id || didSubmit) return
    profileService.getByUserId(user.id).then(result => {
      const hasCompletedKYC = result.success && result.data && result.data.daily_consumption
      navigate(hasCompletedKYC ? '/home' : '/kyc', { replace: true })
    })
  }, [isAuthenticated, user?.id, navigate, didSubmit])

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' }
    if (password.length < 6) return { strength: 1, label: 'Weak', color: 'bg-error' }
    if (password.length < 10) return { strength: 2, label: 'Medium', color: 'bg-brand-light' }
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
        setUser({
          id: result.data.record.id,
          email: result.data.record.email,
          name: result.data.record.name || formData.name,
          avatar: result.data.record.avatar || '',
        })
        // Track registration
        await analyticsService.trackEvent('user_registered', {
          email: formData.email,
          name: formData.name,
        }, result.data.record.id)

        // Show language selection before KYC
        setShowLanguageModal(true)
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
        setUser({
          id: record.id,
          email: record.email,
          name: record.name || record.email,
          avatar: record.avatar || '',
        })
        await analyticsService.trackEvent('user_registered', { method: 'google' }, record.id)

        const profileResult = await profileService.getByUserId(record.id)
        const hasCompletedKYC = profileResult.success && profileResult.data && profileResult.data.daily_consumption
        if (hasCompletedKYC) {
          navigate('/home')
        } else {
          navigate('/kyc')
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
    <div className="min-h-screen pb-20">
      <TopNavigation left="back" center="Sign Up" right="" />

      <div className="app-container px-3 sm:px-4 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <GlassInput
                type="text"
                label="Name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                icon={<User className="w-5 h-5" />}
              />

              <GlassInput
                type="email"
                label="Email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                icon={<Mail className="w-5 h-5" />}
              />

              <GlassInput
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                icon={<Lock className="w-5 h-5" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-text-primary transition-colors"
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
                    <span className="text-xs text-text-primary/70">Password strength</span>
                    <span className={`text-xs font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 glass rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${passwordStrength.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(passwordStrength.strength / 3) * 100}%` }}
                      transition={{ duration: 0.3 }}
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
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="hover:text-text-primary transition-colors"
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
                  className={`mt-1 w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                    acceptedTerms 
                      ? 'bg-brand-primary border-2 border-brand-primary shadow-lg' 
                      : 'bg-white border-2 border-gray-300 hover:border-brand-primary/50'
                  }`}
                >
                  {acceptedTerms && <Check className="w-4 h-4 text-white font-bold" strokeWidth={3} />}
                </button>
                <label 
                  className="text-sm text-text-primary/70 cursor-pointer"
                  onClick={() => setAcceptedTerms(!acceptedTerms)}
                >
                  I agree to the{' '}
                  <Link to="/terms" className="text-brand-primary hover:underline">
                    Terms & Conditions
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-brand-primary hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-error"
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
                {loading ? 'Creating Account...' : 'Create Account'}
              </GlassButton>
            </form>
          </GlassCard>

          {/* Social sign up */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-text-primary/20" />
              <span className="text-xs text-text-primary/50">or</span>
              <div className="flex-1 h-px bg-text-primary/20" />
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

          <div className="text-center">
            <p className="text-text-primary/70">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-brand-primary font-medium hover:underline"
              >
                Login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      <LanguageModal
        isOpen={showLanguageModal}
        onClose={() => {
          setShowLanguageModal(false)
          navigate('/kyc')
        }}
        onLanguageSelected={() => {
          setShowLanguageModal(false)
          navigate('/kyc')
        }}
        showSkip={true}
      />
    </div>
  )
}

