/**
 * Parse a Smono program .docx into dayMeta + steps for seed-program-day.js
 */
import { execSync } from 'child_process'
import { basename } from 'path'

function decodeEntities(s) {
  return s
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

/** Strip Word/markdown artifacts — app renders plain text, not markdown. */
export function cleanText(text) {
  if (!text) return ''
  let s = text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/(^|\n)\*\s+/gm, '$1')
    .replace(/(^|\n)-\s+(?=[A-Za-z"'])/gm, '$1• ')

  // Bullet labels: "• Time — when" → "• Time: when"
  s = s.replace(/(•\s[^\n:—]+)\s—\s/g, '$1: ')

  s = s
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return s
}

function extractRunsText(pXml) {
  let text = ''
  const runRegex = /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g
  let rm
  while ((rm = runRegex.exec(pXml)) !== null) {
    if (/<w:tab/.test(rm[1])) text += '\t'
    const tRegex = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g
    let tm
    while ((tm = tRegex.exec(rm[1])) !== null) {
      text += decodeEntities(tm[1])
    }
    if (/<w:br[^>]*\/>/.test(rm[1])) text += '\n'
  }
  return text
}

function getParagraphStyle(pXml) {
  const styleMatch = pXml.match(/<w:pStyle w:val="([^"]+)"/)
  return styleMatch ? styleMatch[1] : null
}

function isListParagraph(pXml) {
  return /<w:numPr>/.test(pXml) || getParagraphStyle(pXml) === 'ListParagraph'
}

export function extractDocxParagraphs(docxPath) {
  const xml = execSync(`unzip -p "${docxPath.replace(/"/g, '\\"')}" word/document.xml`, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  })

  const paragraphs = []
  const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g
  let pm
  while ((pm = pRegex.exec(xml)) !== null) {
    const fullP = pm[0]
    const pXml = pm[1]
    const raw = extractRunsText(pXml).trim()
    if (!raw) continue
    paragraphs.push({
      text: cleanText(raw),
      style: getParagraphStyle(fullP),
      isList: isListParagraph(fullP),
    })
  }
  return paragraphs
}

/** Legacy flat export for debugging */
export function extractDocxText(docxPath) {
  return extractDocxParagraphs(docxPath)
    .map((p) => (p.isList ? `• ${p.text.replace(/^[*•\-]\s*/, '')}` : p.text))
    .join('\n\n')
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[*_]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

function dayPrefix(n) {
  return `day${String(n).padStart(2, '0')}`
}

function joinParts(parts) {
  return cleanText(parts.join('\n\n'))
}

function splitSectionsFromParagraphs(paragraphs) {
  let dayTitle = ''
  let cbtTechnique = ''
  const introParts = []
  const sections = { modules: [], exercise: null, tool: null, reflection: null, tomorrow: null }

  let current = null

  const flush = () => {
    if (!current) return
    const body = joinParts(current.parts)
    if (current.type === 'module') {
      sections.modules.push({ num: current.num, heading: current.heading, body })
    } else if (current.type === 'exercise') {
      sections.exercise = { title: current.title, body }
    } else if (current.type === 'tool') {
      sections.tool = { title: current.title, body }
    } else if (current.type === 'reflection') {
      sections.reflection = body
    }
    current = null
  }

  for (const para of paragraphs) {
    const t = para.text
    if (!t) continue

    if (/^Day \d+ —/.test(t) && !dayTitle) {
      const m = t.match(/^Day \d+ — (.+)/)
      if (m) dayTitle = m[1].trim()
      continue
    }

    if (/^Smono Reset Method/i.test(t)) continue

    if (/^CBT technique in focus:/i.test(t)) {
      cbtTechnique = t.replace(/^CBT technique in focus:\s*/i, '').trim()
      continue
    }

    if (/^Module \d+ — /.test(t)) {
      flush()
      const m = t.match(/^Module (\d+) — (.+)/)
      current = { type: 'module', num: parseInt(m[1], 10), heading: t, parts: [] }
      continue
    }

    if (/^Today's Exercise — /.test(t)) {
      flush()
      const title = t.replace(/^Today's Exercise — /, '').trim()
      current = { type: 'exercise', title, parts: [] }
      continue
    }

    if (/^Craving Tool — /.test(t)) {
      flush()
      const title = t.replace(/^Craving Tool — /, '').trim()
      current = { type: 'tool', title, parts: [] }
      continue
    }

    if (/^Reflection$/i.test(t)) {
      flush()
      current = { type: 'reflection', parts: [] }
      continue
    }

    if (/^Tomorrow:/i.test(t)) {
      flush()
      sections.tomorrow = t.replace(/^Tomorrow:\s*/i, '').trim()
      continue
    }

    const line = para.isList ? `• ${t.replace(/^[*•\-]\s*/, '')}` : t

    if (current) {
      current.parts.push(line)
    } else {
      introParts.push(line)
    }
  }

  flush()

  return { dayTitle, cbtTechnique, intro: joinParts(introParts), ...sections }
}

export function parseDayDocx(docxPath) {
  const paragraphs = extractDocxParagraphs(docxPath)
  const file = basename(docxPath, '.docx')
  const fileMatch = file.match(/^Day_(\d+)_(.+)$/)
  if (!fileMatch) throw new Error(`Unexpected filename: ${file}`)

  const dayNumber = parseInt(fileMatch[1], 10)
  const fileSlugPart = slugify(fileMatch[2].replace(/_/g, ' '))
  const slug = `day-${String(dayNumber).padStart(2, '0')}-${fileSlugPart}`

  const s = splitSectionsFromParagraphs(paragraphs)
  if (!s.dayTitle) throw new Error('Could not parse day header')

  const dayMeta = {
    day_number: dayNumber,
    slug,
    title: `Day ${dayNumber} — ${s.dayTitle}`,
    subtitle: s.cbtTechnique.split('—')[0]?.trim().slice(0, 80) || s.cbtTechnique.slice(0, 80),
    day_theme: s.intro.split(/\n\n/)[0]?.split(/(?<=[.!?])\s/)[0]?.trim() || s.dayTitle,
    cbt_technique: s.cbtTechnique,
    estimated_duration_min: 20 + Math.min((s.modules?.length || 0) * 3, 15),
  }

  const steps = []
  let order = 1
  const dp = dayPrefix(dayNumber)

  if (s.intro || s.cbtTechnique) {
    const introText = [s.intro, s.cbtTechnique ? `CBT focus today: ${s.cbtTechnique}` : '']
      .filter(Boolean)
      .join('\n\n')
    const hook = s.intro.split(/\n\n/)[0]?.split(/(?<=[.!?])\s/)[0]?.trim() || dayMeta.title
    steps.push({
      order: order++,
      type: 'text',
      module_key: `${dp}_intro`,
      step_title: hook.slice(0, 100),
      slug: `${slug}-intro`,
      content_role: 'intro',
      content_json: { title: hook, text: introText },
    })
  }

  for (const mod of s.modules) {
    steps.push({
      order: order++,
      type: 'text',
      module_key: `${dp}_module_${mod.num}`,
      step_title: mod.heading,
      slug: `${slug}-module-${mod.num}`,
      content_role: 'lesson',
      content_json: { title: mod.heading, text: mod.body },
    })
  }

  if (s.exercise) {
    steps.push({
      order: order++,
      type: 'exercise',
      module_key: `${dp}_exercise`,
      step_title: `Today's Exercise — ${s.exercise.title}`,
      slug: `${slug}-exercise`,
      content_role: 'exercise',
      content_json: {
        title: `Today's Exercise — ${s.exercise.title}`,
        instructions: s.exercise.body,
      },
    })
  }

  if (s.tool) {
    steps.push({
      order: order++,
      type: 'exercise',
      module_key: `${dp}_tool`,
      step_title: `Craving Tool — ${s.tool.title}`,
      slug: `${slug}-tool`,
      content_role: 'tool',
      content_json: {
        title: `Craving Tool — ${s.tool.title}`,
        instructions: s.tool.body,
      },
    })
  }

  if (s.reflection) {
    steps.push({
      order: order++,
      type: 'question_open',
      module_key: `${dp}_reflection`,
      step_title: 'Reflection',
      slug: `${slug}-reflection`,
      content_role: 'reflection',
      content_json: {
        question: s.reflection,
        placeholder: 'Write a few sentences for each prompt…',
      },
    })
  }

  if (s.tomorrow) {
    steps.push({
      order: order++,
      type: 'text',
      module_key: `${dp}_preview`,
      step_title: 'Tomorrow',
      slug: `${slug}-preview`,
      content_role: 'preview',
      content_json: { title: 'Tomorrow', text: s.tomorrow },
    })
  }

  return { dayMeta, steps, sourceFile: basename(docxPath) }
}

export function renderDayModule({ dayMeta, steps, sourceFile }) {
  const lines = [
    `/**`,
    ` * ${dayMeta.title}`,
    ` * Source: ${sourceFile}`,
    ` * Auto-generated from Word doc.`,
    ` */`,
    ``,
    `export const dayMeta = ${JSON.stringify(dayMeta, null, 2)}`,
    ``,
    `export const steps = [`,
  ]

  for (const step of steps) {
    lines.push('  {')
    lines.push(`    order: ${step.order},`)
    lines.push(`    type: '${step.type}',`)
    lines.push(`    module_key: '${step.module_key}',`)
    lines.push(`    step_title: ${JSON.stringify(step.step_title)},`)
    lines.push(`    slug: '${step.slug}',`)
    lines.push(`    content_role: '${step.content_role}',`)
    const json = JSON.stringify(step.content_json, null, 2)
      .split('\n')
      .map((l, i) => (i === 0 ? l : '    ' + l))
      .join('\n')
    lines.push(`    content_json: ${json},`)
    lines.push('  },')
  }

  lines.push(']', '')
  return lines.join('\n')
}
