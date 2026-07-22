import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { LogIn } from 'lucide-react'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAdminAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)
    if (result.success) {
      await queryClient.invalidateQueries()
      navigate('/dashboard')
    } else {
      setError(result.error || 'Login failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(139, 205, 232, 0.45), transparent 55%), radial-gradient(ellipse 70% 45% at 100% 90%, rgba(246, 184, 132, 0.35), transparent 50%), #F4FBFF',
        }}
        aria-hidden
      />
      <div className="relative w-full max-w-md bg-white/85 backdrop-blur-md border border-white/70 rounded-3xl shadow-card-lg p-8">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, #3F8DD2, #6EA48F)' }}
          >
            <LogIn className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-dark tracking-tight">Smono Admin</h1>
          <p className="text-[#4A6574] mt-2 text-sm">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm" role="alert">
              {error}
            </div>
          )}

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
              autoComplete="username"
              className="bo-input"
              placeholder="admin@backoffice.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-dark mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="bo-input"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[15px]">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
