/** Strip AI boilerplate / markdown artifacts from text shown to users. */
export function sanitizePersonalizedText(text: string): string {
  if (!text) return text
  return text
    .replace(/^[\s\-–—•]+/, '')
    .replace(/\b(archetype|CBT|personalization|onboarding profile|tuned to your)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export type WorksheetFormat =
  | { kind: 'stress'; rows: number }
  | { kind: 'grid'; headers: string[]; rowLabels: string[] }
  | { kind: 'fields'; fields: { label: string; hint?: string }[] }
  | { kind: 'lines'; fields: { label: string }[] }

function isWorksheetLine(line: string): boolean {
  if (!line || line.startsWith('•') || line.startsWith('- ')) return false
  if (line.length > 130) return false
  if (/^(Then |The pattern |Most people |At the end )/i.test(line) && line.includes('. ')) return false
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
      label: l.replace(/:\s*_{2,}$/, '').replace(/:\s*___+$/, '').trim(),
    })),
  }
}

export function splitExerciseInstructions(instructions: string): {
  body: string
  suffixLines: string[]
  worksheet: WorksheetFormat | null
} {
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

  const body = parts.slice(0, suffixStart).join('\n\n')
  const suffixLines = parts.slice(suffixStart)
  const worksheet = suffixLines.length ? detectWorksheetFormat(suffixLines) : null
  return { body, suffixLines, worksheet }
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
