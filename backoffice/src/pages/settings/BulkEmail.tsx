import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Send } from 'lucide-react'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { sendAdminBulkEmail } from '../../lib/sendEmail'
import {
  mergeRecipients,
  parseEmailList,
  htmlBodyToText,
  composeFromEmailTemplate,
} from '../../lib/parseEmailList'

type Template = {
  id: string
  name: string
  type?: string
  subject?: string
  content?: string
  trigger_event?: string
  is_active?: boolean
}

type LocState = { emails?: string[] } | null

export const BulkEmail = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const prefilled = ((location.state as LocState)?.emails || [])
    .map((e) => String(e || '').trim().toLowerCase())
    .filter((e) => e.includes('@'))

  const [search, setSearch] = useState('')
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(prefilled.map((e) => [e, true]))
  )
  const [pasted, setPasted] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [ctaLabel, setCtaLabel] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [undelivered, setUndelivered] = useState<string[]>([])

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', 'all', 'bulk-email'],
    queryFn: async () => {
      const result = await adminCollectionHelpers.getFullList('users', {
        fields: 'id,email,name',
        sort: '-created',
      })
      if (!result.success) throw new Error(result.error || 'Failed to load users')
      return result
    },
  })

  const { data: templatesData } = useQuery({
    queryKey: ['notification_templates', 'email', 'bulk'],
    queryFn: async () => {
      const result = await adminCollectionHelpers.getFullList('notification_templates', {
        filter: 'type = "email"',
        sort: 'name',
      })
      if (!result.success) throw new Error(result.error || 'Failed to load templates')
      return result
    },
  })

  const users = useMemo(() => {
    const list = ((usersData?.data || []) as { id: string; email?: string; name?: string }[])
      .map((u) => ({
        id: u.id,
        email: String(u.email || '').trim().toLowerCase(),
        name: u.name || '',
      }))
      .filter((u) => u.email.includes('@'))
    return list
  }, [usersData?.data])

  const templates = (templatesData?.data || []) as unknown as Template[]

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) => u.email.includes(q) || u.name.toLowerCase().includes(q)
    )
  }, [users, search])

  const checkedEmails = useMemo(
    () => Object.keys(checked).filter((e) => checked[e]),
    [checked]
  )

  const recipients = useMemo(
    () => mergeRecipients(checkedEmails, pasted),
    [checkedEmails, pasted]
  )

  // Clear one-shot navigation state so refresh doesn't keep stale picks
  useEffect(() => {
    if (prefilled.length) navigate(location.pathname, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyTemplate = (id: string) => {
    setTemplateId(id)
    const t = templates.find((x) => x.id === id)
    if (!t) return
    setSubject(t.subject || '')
    // Plain body → wrap once. Legacy full HTML → strip chrome first.
    const compose = composeFromEmailTemplate(t)
    setTitle(compose.title)
    setBody(compose.body)
    setCtaLabel(compose.ctaLabel)
    setCtaUrl(compose.ctaUrl)
  }

  const toggleAllVisible = (on: boolean) => {
    setChecked((prev) => {
      const next = { ...prev }
      for (const u of filteredUsers) next[u.email] = on
      return next
    })
  }

  const send = async () => {
    if (!subject.trim()) {
      setMsg('Subject is required.')
      return
    }
    const text = htmlBodyToText(body)
    if (!text) {
      setMsg('Message body is required.')
      return
    }
    if (!recipients.length) {
      setMsg('Select users or paste at least one email.')
      return
    }
    if (!confirm(`Send email to ${recipients.length} recipient(s)?`)) return

    setBusy(true)
    setMsg(null)
    setUndelivered([])
    try {
      // Identical shape to blog publish / segment reminder (those deliver).
      const result = await sendAdminBulkEmail({
        emails: recipients,
        subject: subject.trim(),
        text,
        title: title.trim() || subject.trim(),
        ctaLabel: ctaLabel.trim() || undefined,
        ctaUrl: ctaUrl.trim() || undefined,
      })
      if (!result.ok) {
        setUndelivered([
          ...new Set([
            ...(result.failures || []).map((f) => f.to),
            ...(result.skipped || []),
          ]),
        ])
        setMsg(
          `${result.error || 'Send failed'}${
            result.sent != null ? ` (sent ${result.sent} before errors)` : ''
          }`
        )
        return
      }
      setMsg(
        `Sent ${result.sent} email(s) to: ${recipients.slice(0, 3).join(', ')}${
          recipients.length > 3 ? ` +${recipients.length - 3} more` : ''
        }. Check Inbox/Spam (Gmail may delay).`
      )
    } catch (err: any) {
      setMsg(err?.message || 'Send failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5 min-w-0 max-w-5xl">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-dark tracking-tight">
            Send bulk email
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Check users, paste extra addresses, optionally load a template, then send.
          </p>
        </div>
        <button
          type="button"
          className="text-sm text-primary hover:underline"
          onClick={() => navigate('/settings/templates')}
        >
          Manage templates
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recipients */}
        <section className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-medium text-neutral-dark">Recipients</h2>
            <span className="text-xs text-neutral-500">{recipients.length} total</span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <input
              type="search"
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-sm"
            />
          </div>

          <div className="flex gap-2 text-xs">
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => toggleAllVisible(true)}
            >
              Check visible
            </button>
            <span className="text-neutral-300">·</span>
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => toggleAllVisible(false)}
            >
              Uncheck visible
            </button>
            <span className="text-neutral-300">·</span>
            <button
              type="button"
              className="text-neutral-600 hover:underline"
              onClick={() => setChecked({})}
            >
              Clear checks
            </button>
          </div>

          <div className="border border-neutral-200 rounded-lg max-h-64 overflow-y-auto divide-y divide-neutral-100">
            {usersLoading ? (
              <p className="p-3 text-sm text-neutral-500">Loading users…</p>
            ) : filteredUsers.length === 0 ? (
              <p className="p-3 text-sm text-neutral-500">No users with email.</p>
            ) : (
              filteredUsers.map((u) => (
                <label
                  key={u.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={!!checked[u.email]}
                    onChange={(e) =>
                      setChecked((prev) => ({ ...prev, [u.email]: e.target.checked }))
                    }
                    className="rounded border-neutral-300"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-neutral-800 truncate">
                      {u.name || u.email}
                    </span>
                    {u.name ? (
                      <span className="block text-xs text-neutral-500 truncate">{u.email}</span>
                    ) : null}
                  </span>
                </label>
              ))
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Add emails (paste)
            </label>
            <textarea
              rows={3}
              placeholder="one@example.com, two@example.com&#10;or one per line"
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm font-mono"
            />
            <p className="text-xs text-neutral-500 mt-1">
              {parseEmailList(pasted).length} from paste · commas, spaces, or new lines
            </p>
          </div>
        </section>

        {/* Message */}
        <section className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
          <h2 className="font-medium text-neutral-dark">Message</h2>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Load template (optional)
            </label>
            <select
              value={templateId}
              onChange={(e) => applyTemplate(e.target.value)}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Custom message</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.is_active === false ? ' (inactive)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Shown in branded email header"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Body</label>
            <textarea
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Plain text message (same format as blog / segment emails)…"
            />
            <p className="text-xs text-neutral-500 mt-1">
              HTML templates are converted to plain text, then wrapped like blog publish.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">CTA label</label>
              <input
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">CTA URL</label>
              <input
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          {msg ? (
            <p className="text-sm text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
              {msg}
            </p>
          ) : null}

          {undelivered.length ? (
            <div className="text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 space-y-2">
              <p className="text-amber-900">
                {undelivered.length} recipient{undelivered.length === 1 ? '' : 's'} did not
                receive this. Keep the message as-is and resend to just them.
              </p>
              <textarea
                readOnly
                rows={3}
                value={undelivered.join('\n')}
                className="w-full border border-amber-200 rounded-lg px-2 py-1 text-xs font-mono bg-white"
              />
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => {
                  setChecked({})
                  setPasted(undelivered.join('\n'))
                  setUndelivered([])
                  setMsg(`Loaded ${undelivered.length} address(es) — press Send to retry.`)
                }}
              >
                Retry these {undelivered.length}
              </button>
            </div>
          ) : null}

          <button
            type="button"
            className="btn-primary w-full inline-flex items-center justify-center gap-2"
            disabled={busy}
            onClick={() => void send()}
          >
            {busy ? (
              'Sending…'
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send to {recipients.length || '…'} recipient
                {recipients.length === 1 ? '' : 's'}
              </>
            )}
          </button>
        </section>
      </div>
    </div>
  )
}

export default BulkEmail
