import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { adminCollectionHelpers } from '../../lib/pocketbase'

const LANGUAGES = ['en', 'es', 'fr', 'hi', 'de', 'zh', 'mr', 'gu', 'it'] as const

export default function AddAppUser() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    language: 'en',
    quit_date: new Date().toISOString().slice(0, 10),
  })
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: async () => {
      const email = form.email.trim()
      const name = form.name.trim()
      const password = form.password
      if (!email) throw new Error('Email is required')
      if (password.length < 8) throw new Error('Password must be at least 8 characters')
      if (password !== form.passwordConfirm) throw new Error('Passwords do not match')

      const userResult = await adminCollectionHelpers.create('users', {
        email,
        name,
        password,
        passwordConfirm: form.passwordConfirm,
        emailVisibility: true,
      })
      if (!userResult.success || !userResult.data?.id) {
        throw new Error(userResult.error || 'Failed to create user')
      }

      const userId = String(userResult.data.id)
      const profileResult = await adminCollectionHelpers.create('user_profiles', {
        user: userId,
        language: form.language || 'en',
        quit_date: form.quit_date || new Date().toISOString().slice(0, 10),
        onboarding_name: name || undefined,
      })
      if (!profileResult.success) {
        // User exists; surface profile error so admin can finish setup on detail page
        throw new Error(
          profileResult.error ||
            `User created (${userId}) but profile failed — open the user and save profile fields.`
        )
      }

      return userId
    },
    onSuccess: (userId) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      navigate(`/users/${userId}`, { replace: true })
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to create user')
    },
  })

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <button
          type="button"
          onClick={() => navigate('/users')}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-800 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to users
        </button>
        <h1 className="text-2xl font-semibold text-neutral-dark tracking-tight">Add User</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Create an app account. The user can sign in with this email and password.
        </p>
      </div>

      <form
        className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          setError('')
          createMutation.mutate()
        }}
      >
        <label className="block text-sm">
          <span className="text-neutral-600">Name</span>
          <input
            className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            autoComplete="name"
          />
        </label>
        <label className="block text-sm">
          <span className="text-neutral-600">Email</span>
          <input
            type="email"
            required
            className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            autoComplete="email"
          />
        </label>
        <label className="block text-sm">
          <span className="text-neutral-600">Password</span>
          <input
            type="password"
            required
            minLength={8}
            className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label className="block text-sm">
          <span className="text-neutral-600">Confirm password</span>
          <input
            type="password"
            required
            minLength={8}
            className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2"
            value={form.passwordConfirm}
            onChange={(e) => set('passwordConfirm', e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-neutral-600">Language</span>
            <select
              className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2"
              value={form.language}
              onChange={(e) => set('language', e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-neutral-600">Quit date</span>
            <input
              type="date"
              required
              className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2"
              value={form.quit_date}
              onChange={(e) => set('quit_date', e.target.value)}
            />
          </label>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => navigate('/users')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : 'Create user'}
          </button>
        </div>
      </form>
    </div>
  )
}
