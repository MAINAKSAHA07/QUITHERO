import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'

const LANGUAGES = ['en', 'es', 'fr', 'hi', 'de', 'zh', 'mr', 'gu', 'it'] as const
const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'] as const

type Props = {
  user: { id: string; name?: string; email?: string }
  profile: {
    id?: string
    age?: number
    gender?: string
    language?: string
    phone?: string
    country?: string
    quit_date?: string
    daily_consumption?: number
    onboarding_name?: string
  } | null
  onClose: () => void
}

function dateInputValue(raw?: string): string {
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return String(raw).slice(0, 10)
  return d.toISOString().slice(0, 10)
}

export default function EditAppUserModal({ user, profile, onClose }: Props) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    onboarding_name: profile?.onboarding_name || '',
    phone: profile?.phone || '',
    country: profile?.country || '',
    age: profile?.age != null ? String(profile.age) : '',
    gender: profile?.gender || 'prefer_not_to_say',
    language: profile?.language || 'en',
    quit_date: dateInputValue(profile?.quit_date),
    daily_consumption:
      profile?.daily_consumption != null ? String(profile.daily_consumption) : '',
  })
  const [error, setError] = useState('')

  const saveMutation = useMutation({
    mutationFn: async () => {
      const email = form.email.trim()
      const userPatch: Record<string, string> = {
        name: form.name.trim(),
      }
      // Only send email when we have one — empty email fails PB auth validation
      // (admins previously couldn't read emails without manageRule, so form was blank).
      if (email) userPatch.email = email

      const userResult = await adminCollectionHelpers.update('users', user.id, userPatch)
      if (!userResult.success) {
        throw new Error(userResult.error || 'Failed to update user')
      }

      const quitDate = form.quit_date.trim()
      if (!quitDate) {
        throw new Error('Quit date is required')
      }

      const profilePayload: Record<string, unknown> = {
        onboarding_name: form.onboarding_name.trim(),
        phone: form.phone.trim(),
        language: form.language,
        quit_date: quitDate,
      }
      const country = form.country.trim().toUpperCase()
      if (country) profilePayload.country = country
      if (form.age.trim()) profilePayload.age = Number(form.age)
      if (form.gender) profilePayload.gender = form.gender
      if (form.daily_consumption.trim()) {
        profilePayload.daily_consumption = Number(form.daily_consumption)
      }

      if (profile?.id) {
        const profileResult = await adminCollectionHelpers.update(
          'user_profiles',
          profile.id,
          profilePayload
        )
        if (!profileResult.success) {
          throw new Error(profileResult.error || 'Failed to update profile')
        }
      } else {
        const createResult = await adminCollectionHelpers.create('user_profiles', {
          user: user.id,
          language: form.language || 'en',
          quit_date: quitDate,
          ...profilePayload,
        })
        if (!createResult.success) {
          throw new Error(createResult.error || 'Failed to create profile')
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', user.id] })
      queryClient.invalidateQueries({ queryKey: ['user_profile', user.id] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to save')
    },
  })

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit User</h2>
          <button type="button" onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            ✕
          </button>
        </div>

        <form
          className="p-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            setError('')
            if (user.email && !form.email.trim()) {
              setError('Email is required')
              return
            }
            saveMutation.mutate()
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm col-span-2">
              <span className="text-neutral-600">Name</span>
              <input
                className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </label>
            <label className="block text-sm col-span-2">
              <span className="text-neutral-600">Email</span>
              <input
                type="email"
                className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder={user.email ? undefined : 'Hidden until loaded — enter to set'}
              />
              {!user.email && !form.email && (
                <p className="text-xs text-neutral-500 mt-1">
                  Leave blank to keep the current email unchanged.
                </p>
              )}
            </label>
            <label className="block text-sm">
              <span className="text-neutral-600">Display name</span>
              <input
                className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2"
                value={form.onboarding_name}
                onChange={(e) => set('onboarding_name', e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-neutral-600">Phone</span>
              <input
                className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+9198…"
              />
            </label>
            <label className="block text-sm">
              <span className="text-neutral-600">Country</span>
              <input
                className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2"
                value={form.country}
                onChange={(e) => set('country', e.target.value)}
                placeholder="IN"
              />
            </label>
            <label className="block text-sm">
              <span className="text-neutral-600">Age</span>
              <input
                type="number"
                min={18}
                max={100}
                className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2"
                value={form.age}
                onChange={(e) => set('age', e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-neutral-600">Gender</span>
              <select
                className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2"
                value={form.gender}
                onChange={(e) => set('gender', e.target.value)}
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
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
                className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2"
                value={form.quit_date}
                onChange={(e) => set('quit_date', e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-neutral-600">Daily consumption</span>
              <input
                type="number"
                min={0}
                className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2"
                value={form.daily_consumption}
                onChange={(e) => set('daily_consumption', e.target.value)}
              />
            </label>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
