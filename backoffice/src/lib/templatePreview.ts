/** Detect email body that should render as HTML in preview. */
export function looksLikeHtml(content: string | undefined | null): boolean {
  return /<[a-z][\s\S]*>/i.test(String(content || '').trim())
}

/** Escape plain text for safe srcDoc when content is not HTML. */
export function escapeHtmlForPreview(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Minimal brand shell so plain-text email templates preview like the real send. */
export function wrapPlainEmailPreview(
  text: string,
  opts: { title?: string } = {}
): string {
  const title = escapeHtmlForPreview(opts.title || 'Smono')
  const paragraphs = escapeHtmlForPreview(text)
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.trim().split('\n').join('<br>')
      return `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#0E2538;">${lines}</p>`
    })
    .join('')
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#F4FBFF;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4FBFF;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:20px;border:1px solid rgba(14,37,56,0.08);overflow:hidden;">
        <tr><td style="padding:24px 24px 8px;"><p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#3F8DD2;">Smono</p></td></tr>
        <tr><td style="padding:4px 24px 8px;"><h1 style="margin:0;font-size:24px;line-height:1.2;font-weight:700;color:#0E2538;">${title}</h1></td></tr>
        <tr><td style="padding:12px 24px 24px;">${paragraphs}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

/** Build iframe srcDoc for template preview (scripts blocked via sandbox). */
export function templatePreviewSrcDoc(
  content: string | undefined | null,
  opts: { title?: string; wrapPlain?: boolean } = {}
): string {
  const raw = String(content || '').trim()
  if (!raw) {
    return `<!DOCTYPE html><html><body style="font:14px/1.5 system-ui,sans-serif;color:#5A7384;padding:24px;">(empty template)</body></html>`
  }
  if (looksLikeHtml(raw)) return raw
  if (opts.wrapPlain !== false) return wrapPlainEmailPreview(raw, { title: opts.title })
  return `<!DOCTYPE html><html><body style="font:15px/1.55 system-ui,sans-serif;color:#0E2538;padding:24px;white-space:pre-wrap;">${escapeHtmlForPreview(raw)}</body></html>`
}
