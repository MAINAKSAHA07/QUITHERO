/** Split paste/typed recipient lists into unique emails. */
export function parseEmailList(raw: string): string[] {
  return [
    ...new Set(
      String(raw || '')
        .split(/[\s,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.includes('@') && e.includes('.'))
    ),
  ]
}

/** Merge checkbox picks + pasted list. */
export function mergeRecipients(checked: string[], pasted: string): string[] {
  return [
    ...new Set([
      ...checked.map((e) => e.trim().toLowerCase()).filter((e) => e.includes('@')),
      ...parseEmailList(pasted),
    ]),
  ]
}

/**
 * Templates may store HTML; blog/segment bulk that delivers uses plain text.
 * Strip tags so Send Email matches that path.
 */
export function htmlBodyToText(raw: string): string {
  const s = String(raw || '')
  if (!/<[a-z][\s\S]*>/i.test(s)) return s.trim()
  return s
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<div[^>]*display:\s*none[^>]*>[\s\S]*?<\/div>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

const APP_URL = 'https://app.smono.app'

/** Title + CTA when template body is plain (no H1/CTA in content). */
const COMPOSE_DEFAULTS: Record<
  string,
  { title: string; ctaLabel: string; ctaUrl: string }
> = {
  user_registered: {
    title: 'You’re in the right place',
    ctaLabel: 'Open Smono',
    ctaUrl: APP_URL,
  },
  user_inactive: {
    title: 'Your journey is still here',
    ctaLabel: 'Continue my program',
    ctaUrl: APP_URL,
  },
  purchase_success: {
    title: 'You’re all set',
    ctaLabel: 'Open my program',
    ctaUrl: APP_URL,
  },
  daily_reminder: {
    title: 'A moment for you',
    ctaLabel: 'Open Smono',
    ctaUrl: APP_URL,
  },
  segment_reminder: {
    title: 'A note from Smono',
    ctaLabel: 'Open Smono',
    ctaUrl: APP_URL,
  },
  promotion: {
    title: 'A note from Smono',
    ctaLabel: 'Open Smono',
    ctaUrl: APP_URL,
  },
  blog_published: {
    title: 'New on Smono',
    ctaLabel: 'Read the post',
    ctaUrl: 'https://www.smono.app/blog/',
  },
  support_ticket_response: {
    title: 'You have a new reply',
    ctaLabel: 'Open Messages',
    ctaUrl: `${APP_URL}/profile?support=1`,
  },
}

function isChromeParagraph(text: string): boolean {
  const n = text.trim()
  if (!n) return true
  if (/^smono$/i.test(n)) return true
  if (/^smono\.app$/i.test(n)) return true
  return /you.re receiving this|you.re getting this|sent because|promotional message|targeted reminder|for your security|reply anytime for support|turn them off anytime/i.test(
    n
  )
}

/**
 * Turn a notification_templates email into Bulk Email compose fields.
 * Plain body → use as-is. Legacy full HTML docs → strip chrome so we wrap once.
 */
export function composeFromEmailTemplate(t: {
  content?: string
  name?: string
  subject?: string
  trigger_event?: string
}): { title: string; body: string; ctaLabel: string; ctaUrl: string } {
  const content = String(t.content || '')
  const defaults = COMPOSE_DEFAULTS[String(t.trigger_event || '')] || {
    title: t.name || t.subject || 'Smono',
    ctaLabel: 'Open Smono',
    ctaUrl: APP_URL,
  }

  if (!/<[a-z][\s\S]*>/i.test(content.trim())) {
    return {
      title: defaults.title,
      body: content.trim(),
      ctaLabel: defaults.ctaLabel,
      ctaUrl: defaults.ctaUrl,
    }
  }

  const h1 = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const title = (h1 ? htmlBodyToText(h1[1]) : '') || defaults.title

  const work = content.replace(/<div[^>]*display:\s*none[^>]*>[\s\S]*?<\/div>/gi, '')
  const paragraphs = [...work.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => htmlBodyToText(m[1]))
    .filter((p) => !isChromeParagraph(p))

  let bodyParas = paragraphs
  if (bodyParas[0] && title && bodyParas[0] === title) bodyParas = bodyParas.slice(1)

  const ctaMatch =
    content.match(
      /<a[^>]+href="([^"]+)"[^>]*style="[^"]*display:\s*inline-block[^"]*"[^>]*>([\s\S]*?)<\/a>/i
    ) || content.match(/<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/i)

  return {
    title,
    body: bodyParas.join('\n\n').trim() || htmlBodyToText(work),
    ctaLabel: ctaMatch ? htmlBodyToText(ctaMatch[2]) : defaults.ctaLabel,
    ctaUrl: ctaMatch ? ctaMatch[1] : defaults.ctaUrl,
  }
}
