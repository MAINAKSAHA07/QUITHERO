/**
 * Helpers for RAG-ready program content (plain text extraction, chunking).
 */

const CHUNK_TARGET_CHARS = 900

export function stepPlainText(step) {
  const c = step.content_json || {}
  const title = step.step_title || c.title || ''

  switch (step.type) {
    case 'text':
      return [title, c.text].filter(Boolean).join('\n\n')
    case 'question_open':
      return [title, c.question].filter(Boolean).join('\n\n')
    case 'question_mcq':
      return [title, c.question, ...(c.options || [])].filter(Boolean).join('\n')
    case 'exercise':
      return [title, c.instructions || c.text].filter(Boolean).join('\n\n')
    case 'video':
      return [title, c.title, c.description].filter(Boolean).join('\n\n')
    default:
      return title || JSON.stringify(c)
  }
}

/** Split long lesson text into embedding-sized chunks (paragraph-aware). */
export function chunkBody(text, targetChars = CHUNK_TARGET_CHARS) {
  const trimmed = (text || '').trim()
  if (!trimmed) return []
  if (trimmed.length <= targetChars) return [trimmed]

  const paragraphs = trimmed.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  const chunks = []
  let current = ''

  for (const para of paragraphs) {
    if (current.length + para.length + 2 <= targetChars) {
      current = current ? `${current}\n\n${para}` : para
    } else {
      if (current) chunks.push(current)
      if (para.length <= targetChars) {
        current = para
      } else {
        for (let i = 0; i < para.length; i += targetChars) {
          chunks.push(para.slice(i, i + targetChars))
        }
        current = ''
      }
    }
  }
  if (current) chunks.push(current)
  return chunks
}

export function buildChunkRecords({ programId, programDayId, stepRecord, stepDef, dayMeta, language = 'en' }) {
  const plain = stepPlainText(stepDef)
  const bodies = chunkBody(plain)
  const cbt = dayMeta.cbt_technique || ''

  return bodies.map((body, index) => ({
    program: programId,
    program_day: programDayId,
    step: stepRecord.id,
    slug: `${stepDef.slug}${bodies.length > 1 ? `-chunk-${index + 1}` : ''}`,
    module_key: stepDef.module_key,
    chunk_index: index,
    title: stepDef.step_title || stepDef.content_json?.title || `Day ${dayMeta.day_number} step ${stepDef.order}`,
    body,
    content_role: stepDef.content_role || 'lesson',
    cbt_technique: cbt,
    tags: [
      `day:${dayMeta.day_number}`,
      `module:${stepDef.module_key}`,
      stepDef.content_role || 'lesson',
      cbt ? `cbt:${cbt.toLowerCase().replace(/\s+/g, '_')}` : null,
    ].filter(Boolean),
    language,
    day_number: dayMeta.day_number,
    embedding_status: 'pending',
    token_estimate: Math.ceil(body.length / 4),
    is_active: true,
  }))
}
