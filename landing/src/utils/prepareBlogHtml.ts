/**
 * CMS posts are sometimes full HTML documents (with their own <header>/<style>).
 * Injecting those raw into BlogSiteChrome duplicates chrome and leaks CSS onto the landing shell.
 */

const SCOPE = '.blog-content'

export function isFullHtmlDocument(html: string): boolean {
  const head = html.trimStart().slice(0, 32).toLowerCase()
  return head.startsWith('<!doctype') || head.startsWith('<html')
}

/** Drop script/iframe — CMS HTML is trusted-ish but never run scripts in-app. */
function stripDangerous(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, '')
}

/** Prefix selectors so embedded article CSS cannot restyle the site chrome. */
export function scopeCss(css: string, scope = SCOPE): string {
  let out = css.replace(/:root\b/g, scope)
  let result = ''
  let i = 0
  while (i < out.length) {
    while (i < out.length && /\s/.test(out[i]!)) {
      result += out[i]
      i++
    }
    if (i >= out.length) break

    if (out[i] === '@') {
      const brace = out.indexOf('{', i)
      if (brace === -1) {
        result += out.slice(i)
        break
      }
      const prelude = out.slice(i, brace + 1)
      let depth = 1
      let j = brace + 1
      while (j < out.length && depth > 0) {
        if (out[j] === '{') depth++
        else if (out[j] === '}') depth--
        j++
      }
      const inner = out.slice(brace + 1, j - 1)
      if (/^@(media|supports|layer)\b/i.test(prelude)) {
        result += prelude + scopeCss(inner, scope) + '}'
      } else {
        result += out.slice(i, j)
      }
      i = j
      continue
    }

    const brace = out.indexOf('{', i)
    if (brace === -1) {
      result += out.slice(i)
      break
    }
    const selectors = out.slice(i, brace).trim()
    let depth = 1
    let j = brace + 1
    while (j < out.length && depth > 0) {
      if (out[j] === '{') depth++
      else if (out[j] === '}') depth--
      j++
    }
    const body = out.slice(brace + 1, j - 1)
    if (selectors) {
      const scoped = selectors
        .split(',')
        .map((s) => {
          s = s.trim()
          if (!s) return s
          if (s.startsWith(scope)) return s
          if (/^(html|body)$/i.test(s)) return scope
          return `${scope} ${s}`
        })
        .join(', ')
      result += `${scoped}{${body}}`
    }
    i = j
  }
  return result
}

/** Normalize CMS HTML for safe render inside BlogSiteChrome. */
export function prepareBlogHtml(raw: string): string {
  if (!raw) return ''
  if (!isFullHtmlDocument(raw)) return stripDangerous(raw)

  const styles = [...raw.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1])
  let body =
    raw.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ??
    raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ??
    raw

  // Site chrome already provided by BlogSiteChrome
  body = body
    .replace(/<header\b[\s\S]*?<\/header>/gi, '')
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, '')
    // CMS templates often ship a sticky topbar as <nav>/<div>, not <header>
    .replace(/<(?:nav|div)\b[^>]*class="[^"]*(?:topbar|site-nav|site-header)[^"]*"[^>]*>[\s\S]*?<\/(?:nav|div)>/gi, '')

  body = stripDangerous(body)
  const scoped = styles.map((css) => scopeCss(css)).join('\n')
  return scoped ? `<style>${scoped}</style>${body}` : body
}

/** Plain text for cards/meta — ignore style/script and embedded chrome. */
export function blogPlainText(html: string): string {
  if (!html) return ''
  let src = html
  if (isFullHtmlDocument(html)) {
    src =
      html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ??
      html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ??
      html
    src = src
      .replace(/<header\b[\s\S]*?<\/header>/gi, '')
      .replace(/<footer\b[\s\S]*?<\/footer>/gi, '')
  }
  src = src
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
  return src.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}
