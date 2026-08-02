import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { pb } from '../../lib/pocketbase'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Enter your admin email.')
      return
    }
    setLoading(true)
    try {
      await pb.collection('admin_users').requestPasswordReset(trimmed)
      setSent(true)
    } catch (err: any) {
      setError(err?.message || 'Could not send reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#F4FBFF]">
      <div className="w-full max-w-md bg-white/85 backdrop-blur-md border border-white/70 rounded-3xl shadow-card-lg p-8">
        <h1 className="text-2xl font-bold text-neutral-dark tracking-tight mb-2">Reset admin password</h1>
        <p className="text-sm text-[#4A6574] mb-6">
          We&apos;ll email a reset link to your admin account.
        </p>
        {sent ? (
          <p className="text-sm text-neutral-700 leading-relaxed">
            If an admin account exists for <strong>{email.trim()}</strong>, a reset email is on its
            way.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            ) : null}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-dark mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bo-input"
                autoComplete="username"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-primary font-medium hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}

export function ConfirmPasswordReset() {
  const [params] = useSearchParams()
  const token = useMemo(() => (params.get('token') || '').trim(), [params])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!token) {
      setError('Reset link is missing or expired.')
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
    try {
      await pb.collection('admin_users').confirmPasswordReset(token, password, confirm)
      navigate('/login', { replace: true })
    } catch (err: any) {
      setError(err?.message || 'Reset failed. Request a new link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#F4FBFF]">
      <div className="w-full max-w-md bg-white/85 backdrop-blur-md border border-white/70 rounded-3xl shadow-card-lg p-8">
        <h1 className="text-2xl font-bold text-neutral-dark tracking-tight mb-2">New admin password</h1>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error ? (
            <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          ) : null}
          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-2">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bo-input"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-2">Confirm</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="bo-input"
              autoComplete="new-password"
            />
          </div>
          <button type="submit" disabled={loading || !token} className="btn-primary w-full py-3">
            {loading ? 'Saving…' : 'Update password'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-primary font-medium hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
