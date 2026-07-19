/**
 * In-app toast when support replies (works without Notification permission / native push).
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, X } from 'lucide-react'

type Notice = { ticketId: string | null; title: string; body: string }

export default function SupportReplyToast() {
  const navigate = useNavigate()
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    const onReply = (ev: Event) => {
      const d = (ev as CustomEvent).detail || {}
      setNotice({
        ticketId: d.ticketId || null,
        title: d.title || 'Support replied',
        body: d.body || 'You have a new support reply.',
      })
    }
    window.addEventListener('smono_support_reply', onReply)
    return () => window.removeEventListener('smono_support_reply', onReply)
  }, [])

  useEffect(() => {
    if (!notice) return
    const id = window.setTimeout(() => setNotice(null), 8000)
    return () => window.clearTimeout(id)
  }, [notice])

  if (!notice) return null

  const open = () => {
    const q = notice.ticketId
      ? `?support=${encodeURIComponent(notice.ticketId)}`
      : '?support='
    setNotice(null)
    navigate(`/profile${q}`)
  }

  return (
    <div className="fixed top-[max(0.75rem,env(safe-area-inset-top))] left-0 right-0 z-[120] flex justify-center px-3 pointer-events-none">
      <div
        role="status"
        className="pointer-events-auto w-full max-w-md rounded-2xl bg-[#0E2538] text-white shadow-lg border border-white/10 p-3 flex gap-3 items-start"
      >
        <button
          type="button"
          onClick={open}
          className="flex-1 flex gap-3 items-start text-left min-w-0"
        >
          <span className="w-9 h-9 rounded-full bg-[#3F8DD2]/25 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-4 h-4 text-[#8BCDE8]" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold truncate">{notice.title}</span>
            <span className="block text-xs text-white/70 mt-0.5 line-clamp-2">{notice.body}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setNotice(null)}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
