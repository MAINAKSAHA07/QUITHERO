import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Download, Share2, X } from 'lucide-react'
import SmonoLogo from './SmonoLogo'
import { haptic, hapticPatterns } from '../utils/haptic'
import {
  certificateDaysLabel,
  formatCertificateDate,
} from '../utils/certificate'

const BLUE = '#3F8DD2'
const ORANGE = '#F99E59'
const INK = '#0E2538'
const W = 1080
const H = 1350

interface CertificateModalProps {
  isOpen: boolean
  onClose: () => void
  name: string
  daysSmokeFree: number
  quitDate: string
  onDownloaded?: () => void
}

function drawCertificate(
  ctx: CanvasRenderingContext2D,
  opts: { name: string; days: number; quitDate: string; logo?: HTMLImageElement | null }
) {
  const { name, days, quitDate, logo } = opts

  // Soft paper
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#FFFBF7')
  bg.addColorStop(0.55, '#FFFFFF')
  bg.addColorStop(1, '#F4FBFF')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Atmosphere orbs
  const orbA = ctx.createRadialGradient(180, 160, 0, 180, 160, 420)
  orbA.addColorStop(0, 'rgba(249,158,89,0.22)')
  orbA.addColorStop(1, 'rgba(249,158,89,0)')
  ctx.fillStyle = orbA
  ctx.fillRect(0, 0, W, H)

  const orbB = ctx.createRadialGradient(920, 1180, 0, 920, 1180, 480)
  orbB.addColorStop(0, 'rgba(63,141,210,0.18)')
  orbB.addColorStop(1, 'rgba(63,141,210,0)')
  ctx.fillStyle = orbB
  ctx.fillRect(0, 0, W, H)

  // Frame
  ctx.strokeStyle = 'rgba(14,37,56,0.08)'
  ctx.lineWidth = 2
  roundRect(ctx, 48, 48, W - 96, H - 96, 36)
  ctx.stroke()

  ctx.strokeStyle = ORANGE
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 3
  roundRect(ctx, 72, 72, W - 144, H - 144, 28)
  ctx.stroke()
  ctx.globalAlpha = 1

  // Logo
  if (logo && logo.complete && logo.naturalWidth > 0) {
    const lw = 280
    const lh = (logo.naturalHeight / logo.naturalWidth) * lw
    ctx.drawImage(logo, (W - lw) / 2, 140, lw, lh)
  } else {
    ctx.fillStyle = BLUE
    ctx.font = '700 54px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('smono', W / 2, 200)
  }

  // Eyebrow
  ctx.fillStyle = 'rgba(14,37,56,0.45)'
  ctx.font = '600 28px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('CERTIFICATE OF ACHIEVEMENT', W / 2, 360)

  // Hairline
  ctx.strokeStyle = 'rgba(14,37,56,0.12)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(W / 2 - 120, 390)
  ctx.lineTo(W / 2 + 120, 390)
  ctx.stroke()

  ctx.fillStyle = 'rgba(14,37,56,0.55)'
  ctx.font = '400 30px system-ui, -apple-system, sans-serif'
  ctx.fillText('This certifies that', W / 2, 460)

  // Name — display tracking
  ctx.fillStyle = INK
  ctx.font = '700 64px system-ui, -apple-system, sans-serif'
  ctx.fillText(name || 'Hero', W / 2, 545)

  ctx.fillStyle = 'rgba(14,37,56,0.55)'
  ctx.font = '400 30px system-ui, -apple-system, sans-serif'
  ctx.fillText('has been', W / 2, 610)

  // Days hero
  ctx.fillStyle = BLUE
  ctx.font = '800 160px system-ui, -apple-system, sans-serif'
  ctx.fillText(String(Math.max(0, days)), W / 2, 780)

  ctx.fillStyle = ORANGE
  ctx.font = '700 42px system-ui, -apple-system, sans-serif'
  ctx.fillText(days === 1 ? 'DAY SMOKE-FREE' : 'DAYS SMOKE-FREE', W / 2, 850)

  // Meta
  const quitLabel = quitDate ? formatCertificateDate(quitDate) : ''
  const issued = formatCertificateDate(new Date())
  ctx.fillStyle = 'rgba(14,37,56,0.5)'
  ctx.font = '500 26px system-ui, -apple-system, sans-serif'
  if (quitLabel) ctx.fillText(`Quit date  ·  ${quitLabel}`, W / 2, 960)
  ctx.fillText(`Issued  ·  ${issued}`, W / 2, 1005)

  ctx.fillStyle = 'rgba(14,37,56,0.4)'
  ctx.font = '400 24px system-ui, -apple-system, sans-serif'
  ctx.fillText('Keep going. Every day counts.', W / 2, 1120)
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

export default function CertificateModal({
  isOpen,
  onClose,
  name,
  daysSmokeFree,
  quitDate,
  onDownloaded,
}: CertificateModalProps) {
  const reduce = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const days = Math.max(0, Math.floor(daysSmokeFree || 0))

  useEffect(() => {
    if (!isOpen) return
    haptic(hapticPatterns.achievement)
    let cancelled = false
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const logo = new Image()
    logo.crossOrigin = 'anonymous'
    const paint = () => {
      if (cancelled) return
      drawCertificate(ctx, {
        name: name.trim() || 'Hero',
        days,
        quitDate,
        logo: logo.complete && logo.naturalWidth > 0 ? logo : null,
      })
      setPreviewUrl(canvas.toDataURL('image/png'))
      if (canvasRef.current) {
        const live = canvasRef.current.getContext('2d')
        if (live) {
          canvasRef.current.width = W
          canvasRef.current.height = H
          live.drawImage(canvas, 0, 0)
        }
      }
    }
    logo.onload = paint
    logo.onerror = paint
    logo.src = '/smonologo.webp?v=3'
    // Fallback if cached
    if (logo.complete) paint()

    return () => {
      cancelled = true
    }
  }, [isOpen, name, days, quitDate])

  const downloadPng = async () => {
    if (!previewUrl || busy) return
    setBusy(true)
    try {
      const a = document.createElement('a')
      a.href = previewUrl
      a.download = `smono-certificate-${new Date().toISOString().slice(0, 10)}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      haptic(hapticPatterns.success)
      onDownloaded?.()
    } finally {
      setBusy(false)
    }
  }

  const sharePng = async () => {
    if (!previewUrl || busy) return
    setBusy(true)
    try {
      const res = await fetch(previewUrl)
      const blob = await res.blob()
      const file = new File([blob], `smono-certificate.png`, { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'smono certificate',
          text: certificateDaysLabel(days),
        })
        haptic(hapticPatterns.success)
        onDownloaded?.()
        return
      }
      await downloadPng()
    } catch {
      // User cancelled share — ignore
    } finally {
      setBusy(false)
    }
  }

  const sheet = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 28, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 20, scale: 0.97 },
      }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.15 : 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="certificate-title"
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          {/* Dim to focus */}
          <div className="absolute inset-0 bg-[#0E2538]/45 backdrop-blur-[18px] saturate-150" />

          <motion.div
            {...sheet}
            transition={
              reduce
                ? { duration: 0.18 }
                : { type: 'spring', stiffness: 380, damping: 32, mass: 0.9 }
            }
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md mx-auto mb-0 sm:mb-6 px-0 sm:px-4"
          >
            <div className="rounded-t-[28px] sm:rounded-[28px] overflow-hidden bg-white/90 border border-white/70 shadow-[0_-8px_40px_rgba(14,37,56,0.18)] backdrop-blur-xl">
              {/* Grabber — sheet affordance */}
              <div className="flex justify-center pt-3 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-[#0E2538]/15" />
              </div>

              <div className="flex items-center justify-between px-5 pt-3 pb-2">
                <div>
                  <p
                    id="certificate-title"
                    className="text-[17px] font-semibold text-[#0E2538] tracking-tight"
                  >
                    Your certificate
                  </p>
                  <p className="text-[13px] text-[#0E2538]/50 mt-0.5">
                    {certificateDaysLabel(days)}
                  </p>
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-[#0E2538]/06 flex items-center justify-center active:bg-[#0E2538]/10"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-[#0E2538]/70" />
                </motion.button>
              </div>

              <div className="px-5 pb-4">
                <div className="relative rounded-2xl overflow-hidden border border-[#0E2538]/06 bg-[#FFFBF7] shadow-[0_8px_24px_rgba(63,141,210,0.08)]">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Smoke-free certificate"
                      className="w-full h-auto block select-none"
                      draggable={false}
                    />
                  ) : (
                    <div className="aspect-[1080/1350] flex flex-col items-center justify-center gap-3 p-8">
                      <SmonoLogo size="md" />
                      <p className="text-sm text-[#0E2538]/40">Preparing…</p>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" aria-hidden />
                </div>
              </div>

              <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex gap-3">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  disabled={!previewUrl || busy}
                  onClick={sharePng}
                  className="flex-1 py-3.5 rounded-2xl bg-[#3F8DD2] text-white font-semibold text-[15px] flex items-center justify-center gap-2 shadow-[0_6px_16px_rgba(63,141,210,0.35)] disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  disabled={!previewUrl || busy}
                  onClick={downloadPng}
                  className="flex-1 py-3.5 rounded-2xl bg-[#FFF1E6] text-[#C46A2E] font-semibold text-[15px] flex items-center justify-center gap-2 border border-[#F6B884]/50 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Save
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
