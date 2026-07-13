/** Strip AI boilerplate / markdown artifacts from text shown to users. */
export function sanitizePersonalizedText(text: string): string {
  if (!text) return text
  return text
    .replace(/^[\s\-–—•*]+/, '')
    .replace(/^(?:AI|A\.I\.)\s*[-:–—]\s*/i, '')
    .replace(/^\[(?:AI|system)\]\s*/i, '')
    .replace(/\b(archetype|CBT|personalization|onboarding profile|tuned to your|as an AI)\b/gi, '')
    .replace(/\s*[-–—]\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Sanitize program step copy (less aggressive than personalization strip) */
export function sanitizeStepText(text: string): string {
  if (!text) return text
  return text
    .replace(/^(?:AI|A\.I\.)\s*[-:–—]\s*/gim, '')
    .replace(/\b(as an AI|personalization engine)\b/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export type WorksheetFormat =
  | { kind: 'stress'; rows: number }
  | { kind: 'grid'; headers: string[]; rowLabels: string[] }
  | { kind: 'fields'; fields: { label: string; hint?: string }[] }
  | { kind: 'lines'; fields: { label: string }[] }
  | { kind: 'repeat'; rows: number; fields: { label: string; hint?: string }[] }

const WORD_TO_NUM: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
}

function shortenBulletLabel(bullet: string): string {
  const capture = bullet.search(/[.:] Capture|\. Rewrite/i)
  const period = bullet.indexOf('. ')
  let end = bullet.length
  if (capture > 0) end = Math.min(end, capture)
  else if (period > 0 && period < 70) end = period + 1
  const label = bullet.slice(0, end).replace(/[.:]$/, '').trim()
  return label.length > 55 ? `${label.slice(0, 52)}…` : label
}

function parseMinRows(text: string): number | null {
  const atLeast = text.match(/at least (\w+)/i)
  if (atLeast) return WORD_TO_NUM[atLeast[1].toLowerCase()] ?? null
  return null
}

function hasBlankMarker(text: string): boolean {
  return (
    /(?:^|\n)\s*[•\-]?\s*[^:\n]+:\s*(?:£\/\$\s*)?_{2,}/m.test(text) ||
    /\s→\s*_{2,}/.test(text) ||
    /Time free:\s*_{2,}/i.test(text)
  )
}

function blankFieldLabel(text: string): string {
  return text
    .replace(/^[•\-\*\d.)]+\s*/, '')
    .replace(/:\s*£\/\$\s*_{2,}.*$/, '')
    .replace(/:\s*_{2,}.*$/, '')
    .replace(/\s*→\s*_{2,}/g, ' →')
    .replace(/_{2,}/g, '')
    .replace(/:\s*$/, '')
    .trim()
}

function isWritePromptPart(part: string): boolean {
  if (hasBlankMarker(part)) return false
  if (/^[•-]\s/.test(part)) return false
  if (/^\d+\.?$/.test(part)) return false
  if (/^Then do the money maths/i.test(part)) return false
  return (
    (/\(write|write each/i.test(part) && part.length < 200) ||
    (/^What .+/i.test(part) && part.includes('(')) ||
    (/^Finish with/i.test(part) && /sentence/i.test(part)) ||
    /Complete:\s*"/i.test(part) ||
    /^Write a short letter/i.test(part)
  )
}

function isBulletWritePart(part: string): boolean {
  if (!/^[•-]\s/.test(part)) return false
  const text = part.replace(/^[•-]\s*/, '')
  if (/rate your stress|smoke as you normally|ten minutes later|right after, rate/i.test(text)) return false
  return /write (?:down|each|a |your |it down|three)|compare the two|notice the evidence|acknowledg|credit for|identity statement/i.test(
    text
  )
}

function isValuesGridHeader(lines: string[]): boolean {
  if (lines.length !== 3) return false
  const normalized = lines.map((l) => l.toLowerCase().trim())
  return (
    normalized[0] === 'my value' &&
    normalized[1].includes('smoking') &&
    normalized[2].includes('freedom')
  )
}

/** Find stress/grid tables embedded before closing paragraphs. */
function detectEmbeddedWorksheet(instructions: string): {
  format: WorksheetFormat
  body: string
} | null {
  const parts = instructions.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)

  for (let start = 0; start < parts.length; start++) {
    for (let end = parts.length; end > start; end--) {
      const candidateLines = parts
        .slice(start, end)
        .flatMap((p) => p.split('\n').map((l) => l.trim()).filter(Boolean))
      if (candidateLines.length < 4) {
        if (isValuesGridHeader(candidateLines)) {
          return {
            format: {
              kind: 'repeat',
              rows: 4,
              fields: candidateLines.map((label) => ({ label })),
            },
            body: [...parts.slice(0, start), ...parts.slice(end)].join('\n\n'),
          }
        }
        continue
      }
      if (candidateLines.some(hasBlankMarker)) continue
      const format = detectWorksheetFormat(candidateLines)
      if (format?.kind === 'grid') {
        if (format.headers.some((h) => /list at least|^[•-]/.test(h) || h.length > 72)) continue
        if (format.rowLabels.every((l) => /^\d+\.?$/.test(l))) continue
      }
      if (format?.kind === 'grid' || format?.kind === 'stress') {
        return {
          format,
          body: [...parts.slice(0, start), ...parts.slice(end)].join('\n\n'),
        }
      }
    }
  }
  return null
}

/** Blanks and write-prompts can appear mid-instruction; suffix-only detection misses them. */
function detectScatteredWorksheet(instructions: string): {
  format: WorksheetFormat
  body: string
} | null {
  const parts = instructions.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  const fields: { label: string; hint?: string }[] = []
  const keepParts: string[] = []
  let foundAny = false

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    if (/list (?:at least )?\w+|list two or three/i.test(part)) {
      const run: string[] = []
      let j = i + 1
      while (j < parts.length && /^\d+\.?$/.test(parts[j])) {
        run.push(parts[j])
        j++
      }
      if (run.length >= 2) {
        const heading = part.replace(/\n/g, ' ').slice(0, 72)
        run.forEach((_, idx) => {
          fields.push({ label: `${heading} — ${idx + 1}` })
        })
        foundAny = true
        i = j - 1
        continue
      }
    }

    if (/^\d+\.?$/.test(part)) {
      continue
    }

    const lines = part.split('\n').map((l) => l.trim()).filter(Boolean)
    const blankLines = lines.filter(hasBlankMarker)
    if (blankLines.length) {
      blankLines.forEach((line) => {
        fields.push({ label: blankFieldLabel(line) || 'Your answer' })
      })
      const intro = lines.filter((l) => !hasBlankMarker(l)).join('\n')
      if (intro && !/^Then /i.test(intro)) keepParts.push(intro)
      foundAny = true
      continue
    }

    if (isWritePromptPart(part)) {
      fields.push({
        label: shortenBulletLabel(part),
        hint: part.length > shortenBulletLabel(part).length + 8 ? part : undefined,
      })
      foundAny = true
      continue
    }

    if (isBulletWritePart(part)) {
      const text = part.replace(/^[•-]\s*/, '')
      if (/for each, write one line/i.test(text)) {
        keepParts.push(part)
        continue
      }
      fields.push({
        label: shortenBulletLabel(text),
        hint: text.length > shortenBulletLabel(text).length + 8 ? text : undefined,
      })
      foundAny = true
      continue
    }

    if (/write down .+ and beside it/i.test(part)) {
      fields.push({ label: 'Harshest thing your inner critic says' })
      fields.push({ label: 'Accurate, compassionate version' })
      foundAny = true
      continue
    }

    keepParts.push(part)
  }

  if (!foundAny || !fields.length) return null
  return {
    format: { kind: 'fields', fields },
    body: keepParts.join('\n\n'),
  }
}

/** Bullet lists after "write down two things" / "note three quick things" → repeatable row form */
function detectRepeatFromBullets(instructions: string): {
  format: WorksheetFormat
  body: string
} | null {
  const parts = instructions.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (!/write down (\w+) things?|note (\w+) quick things|answer,?\s+in writing/i.test(part)) continue

    const fieldBullets: string[] = []
    let j = i + 1
    while (j < parts.length && /^[•-]\s/.test(parts[j])) {
      fieldBullets.push(parts[j].replace(/^[•-]\s*/, ''))
      j++
    }
    if (fieldBullets.length < 2) continue

    const rows = parseMinRows(instructions) ?? 5
    const fields = fieldBullets.map((b) => ({
      label: shortenBulletLabel(b),
      hint: b.length > shortenBulletLabel(b).length + 8 ? b : undefined,
    }))

    const body = [...parts.slice(0, i + 1), ...parts.slice(j)].join('\n\n')
    return { format: { kind: 'repeat', rows, fields }, body }
  }

  return null
}

function isWorksheetLine(line: string): boolean {
  if (!line) return false
  const cleanLine = line.replace(/^[•\-\*\s]+/, '').trim()
  if (!cleanLine) return false
  if (cleanLine.length > 130) return false
  if (/^(Then |The pattern |Most people |At the end )/i.test(cleanLine) && cleanLine.includes('. ')) return false
  return true
}

export function detectWorksheetFormat(lines: string[]): WorksheetFormat | null {
  const trimmed = [...lines]
  while (trimmed.length && !isWorksheetLine(trimmed[trimmed.length - 1])) {
    trimmed.pop()
  }
  if (!trimmed.length) return null

  if (trimmed.includes('Before') && trimmed.includes('Right after')) {
    const rowCount = trimmed.filter((l) => /^\d+$/.test(l)).length || 2
    return { kind: 'stress', rows: rowCount }
  }

  if (trimmed[0] === 'Column' && trimmed[1] === 'Your entry') {
    const fields: { label: string; hint?: string }[] = []
    for (let i = 2; i + 1 < trimmed.length; i += 2) {
      fields.push({ label: trimmed[i], hint: trimmed[i + 1] })
    }
    if (fields.length) return { kind: 'fields', fields }
  }

  for (let rowCount = 2; rowCount <= 6; rowCount++) {
    if (trimmed.length <= rowCount + 1) continue
    const rowLabels = trimmed.slice(-rowCount)
    const headers = trimmed.slice(0, trimmed.length - rowCount)
    if (headers.length >= 2 && headers.length <= 7 && rowLabels.every((l) => l.length < 60)) {
      return { kind: 'grid', headers, rowLabels }
    }
  }

  for (let colCount = 2; colCount <= 5; colCount++) {
    const dataLen = trimmed.length - colCount
    if (dataLen > 0 && dataLen % colCount === 0) {
      const rowCount = dataLen / colCount
      if (rowCount >= 2 && rowCount <= 8) {
        const headers = trimmed.slice(0, colCount)
        const rest = trimmed.slice(colCount)
        const rowLabels: string[] = []
        for (let r = 0; r < rowCount; r++) {
          rowLabels.push(rest[r * colCount])
        }
        if (rowLabels.every((l) => l.length < 60)) {
          return { kind: 'grid', headers, rowLabels }
        }
      }
    }
  }

  return {
    kind: 'lines',
    fields: trimmed.map((l) => ({
      label: l.replace(/^[•\-\*\s]+/, '').replace(/:\s*_{2,}$/, '').replace(/:\s*___+$/, '').trim(),
    })),
  }
}

export function splitExerciseInstructions(instructions: string): {
  body: string
  suffixLines: string[]
  worksheet: WorksheetFormat | null
} {
  const repeat = detectRepeatFromBullets(instructions)
  if (repeat) {
    return { body: repeat.body, suffixLines: [], worksheet: repeat.format }
  }

  const parts = instructions.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  let suffixStart = parts.length
  for (let i = parts.length - 1; i >= 0; i--) {
    if (isWorksheetLine(parts[i])) suffixStart = i
    else break
  }
  while (suffixStart < parts.length) {
    const last = parts[parts.length - 1]
    if (last && !isWorksheetLine(last)) parts.pop()
    else break
  }

  const bodyFromSuffix = parts.slice(0, suffixStart).join('\n\n')
  const suffixLines = parts.slice(suffixStart)
  const suffixWorksheet = suffixLines.length ? detectWorksheetFormat(suffixLines) : null
  if (suffixWorksheet) {
    return { body: bodyFromSuffix, suffixLines, worksheet: suffixWorksheet }
  }

  if (hasBlankMarker(instructions)) {
    const blankWorksheet = detectScatteredWorksheet(instructions)
    if (blankWorksheet) {
      return { body: blankWorksheet.body, suffixLines: [], worksheet: blankWorksheet.format }
    }
  }

  const embedded = detectEmbeddedWorksheet(instructions)
  if (embedded) {
    return { body: embedded.body, suffixLines: [], worksheet: embedded.format }
  }

  const scattered = detectScatteredWorksheet(instructions)
  if (scattered) {
    return { body: scattered.body, suffixLines: [], worksheet: scattered.format }
  }

  return { body: bodyFromSuffix, suffixLines, worksheet: null }
}

export function formatInstructionBullets(text: string): string[] {
  const paragraphs = text.split(/\n\n+/)
  const bullets: string[] = []
  for (const block of paragraphs) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    for (const line of lines) {
      if (line.startsWith('• ') || line.startsWith('- ')) {
        bullets.push(line.replace(/^[•-]\s*/, ''))
      }
    }
  }
  return bullets
}

export function formatInstructionParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p && !p.split('\n').every((l) => /^[•-]\s/.test(l.trim()) || !l.trim()))
}

export function splitReflectionPrompts(question: string): string[] {
  const parts = question
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length <= 1) return parts

  const prompts: string[] = []
  for (const part of parts) {
    const lines = part.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length > 1 && lines.every((l) => l.startsWith('•') || l.startsWith('-'))) {
      lines.forEach((l) => prompts.push(l.replace(/^[•-]\s*/, '')))
    } else if (part.startsWith('•') || part.startsWith('-')) {
      prompts.push(part.replace(/^[•-]\s*/, ''))
    } else {
      prompts.push(part)
    }
  }
  return prompts
}

export type WorksheetPayload =
  | { kind: 'stress'; rows: { before: string; after: string; tenMin: string; touchedProblem: string }[] }
  | { kind: 'grid'; headers: string[]; rows: { label: string; values: string[] }[] }
  | { kind: 'fields'; values: Record<string, string> }
  | { kind: 'lines'; values: Record<string, string> }
  | { kind: 'repeat'; rows: { values: Record<string, string> }[] }
