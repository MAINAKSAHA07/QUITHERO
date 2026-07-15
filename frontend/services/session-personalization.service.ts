import { pb } from '../lib/pocketbase'
import { PersonalizedContent } from '../types/models'

export type SessionAiRecordType =
  | 'personalization'
  | 'trigger_check'
  | 'comprehension_check'
  | 'comprehension_reread'

export type SessionAiSource = 'ai' | 'fallback' | 'cache' | 'db'

interface SessionAiMemoryRow {
  id: string
  user: string
  day_number: number
  program_day?: string
  record_type: SessionAiRecordType
  payload_json: Record<string, unknown>
  is_correct?: boolean
  source?: string
  created: string
}

class SessionPersonalizationService {
  async saveContentPayload(
    userId: string,
    dayNumber: number,
    content: PersonalizedContent,
    source: SessionAiSource,
    programDayId?: string
  ): Promise<void> {
    try {
      const existing = await pb.collection('session_ai_memory').getFirstListItem(
        `user = "${userId}" && day_number = ${dayNumber} && record_type = "personalization"`
      ).catch(() => null)

      const data = {
        user: userId,
        day_number: dayNumber,
        record_type: 'personalization',
        payload_json: content as unknown as Record<string, unknown>,
        source,
        ...(programDayId ? { program_day: programDayId } : {}),
      }

      if (existing) {
        await pb.collection('session_ai_memory').update(existing.id, data)
      } else {
        await pb.collection('session_ai_memory').create(data)
      }
    } catch (e) {
      console.warn('[SessionPersonalization] saveContentPayload failed:', e)
    }
  }

  async getStoredPersonalization(
    userId: string,
    dayNumber: number
  ): Promise<PersonalizedContent | null> {
    try {
      const row = await pb.collection('session_ai_memory').getFirstListItem(
        `user = "${userId}" && day_number = ${dayNumber} && record_type = "personalization"`
      ) as unknown as SessionAiMemoryRow
      return (row.payload_json || null) as PersonalizedContent | null
    } catch {
      return null
    }
  }

  async saveTriggerCheck(
    userId: string,
    dayNumber: number,
    programDayId: string | undefined,
    payload: {
      question: string
      options: string[]
      selected: string
      selected_index?: number
    }
  ): Promise<void> {
    await this.appendRecord(userId, dayNumber, programDayId, 'trigger_check', payload)
  }

  async saveComprehensionCheck(
    userId: string,
    dayNumber: number,
    programDayId: string | undefined,
    payload: {
      question: string
      options: string[]
      selected_index: number
      selected: string
      correct_index: number
      is_correct: boolean
      thought_of_the_day?: [string, string]
    }
  ): Promise<void> {
    await this.appendRecord(userId, dayNumber, programDayId, 'comprehension_check', payload, payload.is_correct)
  }

  async saveComprehensionReread(
    userId: string,
    dayNumber: number,
    programDayId?: string
  ): Promise<void> {
    await this.appendRecord(userId, dayNumber, programDayId, 'comprehension_reread', { action: 'reread_requested' })
  }

  async buildSessionHistoryContext(userId: string, currentDay: number): Promise<string> {
    const [memoryLines, stepLines] = await Promise.all([
      this.buildAiMemoryContext(userId, currentDay),
      this.buildStepResponseContext(userId, currentDay),
    ])
    return [memoryLines, stepLines].filter(Boolean).join('\n\n')
  }

  private async buildAiMemoryContext(userId: string, currentDay: number): Promise<string> {
    try {
      const rows = await pb.collection('session_ai_memory').getList(1, 30, {
        filter: `user = "${userId}" && record_type != "personalization"`,
        sort: '-created',
      })

      if (!rows.items.length) {
        return 'SESSION MEMORY:\n- No prior check-in history yet.'
      }

      const lines: string[] = ['SESSION MEMORY (prior interactions — maintain tone continuity, never repeat verbatim):']

      for (const raw of rows.items as unknown as SessionAiMemoryRow[]) {
        if (raw.day_number >= currentDay) continue
        const p = raw.payload_json || {}
        if (raw.record_type === 'trigger_check') {
          lines.push(`- Day ${raw.day_number} trigger check: answered "${p.selected || 'unknown'}"`)
        } else if (raw.record_type === 'comprehension_check') {
          const status = raw.is_correct ? 'PASSED' : 'FAILED'
          lines.push(`- Day ${raw.day_number} comprehension: ${status} (picked "${p.selected || 'unknown'}")`)
        } else if (raw.record_type === 'comprehension_reread') {
          lines.push(`- Day ${raw.day_number}: user re-read content after comprehension miss`)
        }
      }

      if (lines.length === 1) {
        lines.push('- No prior check-in history on earlier days.')
      }

      return lines.join('\n')
    } catch {
      return 'SESSION MEMORY:\n- Unavailable.'
    }
  }

  /** Summarize saved reflections and exercise worksheets for AI context (not shown in UI). */
  async buildStepResponseContext(userId: string, currentDay: number): Promise<string> {
    try {
      const rows = await pb.collection('step_responses').getList(1, 40, {
        filter: `user = "${userId}"`,
        expand: 'step,step.program_day',
        sort: '-id',
      })

      const lines: string[] = ['USER INPUT HISTORY (reflections & exercises — use for tone, never quote verbatim):']
      let count = 0

      const clip = (s: string, n: number) =>
        s.length > n ? `${s.slice(0, n)}…` : s

      const stepQuestion = (step: any): string => {
        const c = step?.content_json || {}
        const raw = String(c.question || c.prompt || step?.step_title || step?.plain_text || '').trim()
        return clip(raw.replace(/\s+/g, ' '), 140)
      }

      for (const raw of rows.items as any[]) {
        const step = raw.expand?.step
        const dayNum = step?.expand?.program_day?.day_number ?? null
        if (dayNum != null && dayNum >= currentDay) continue

        const payload = raw.response_json || {}
        const slug = step?.slug || raw.step
        const qFromPayload = String(payload.question || '').replace(/\s+/g, ' ').trim()
        const qFromStep = stepQuestion(step)
        const q = qFromPayload || qFromStep

        if (Array.isArray(payload.answers) && payload.answers.length) {
          for (const item of payload.answers) {
            const itemQ = String(item.prompt || q || '').slice(0, 100)
            const a = String(item.answer || '').slice(0, 120)
            if (!a) continue
            lines.push(
              `- Day ${dayNum ?? '?'} reflection (${slug}) Q: "${itemQ}${itemQ.length >= 100 ? '…' : ''}" → "${a}${String(item.answer).length > 120 ? '…' : ''}"`
            )
            count++
          }
        } else if (payload.answer) {
          const a = clip(String(payload.answer), 120)
          if (q) {
            lines.push(`- Day ${dayNum ?? '?'} reflection (${slug}) Q: "${clip(q, 140)}" → "${a}"`)
          } else {
            lines.push(`- Day ${dayNum ?? '?'} reflection (${slug}): "${a}"`)
          }
          count++
        } else if (payload.worksheet?.values && typeof payload.worksheet.values === 'object') {
          const pairs = Object.entries(payload.worksheet.values as Record<string, unknown>)
            .filter(([, v]) => String(v ?? '').trim())
            .slice(0, 6)
            .map(([k, v]) => `${clip(String(k), 40)}="${clip(String(v), 60)}"`)
          if (pairs.length) {
            const head = q ? `Q: "${clip(q, 80)}" · ` : ''
            lines.push(`- Day ${dayNum ?? '?'} exercise (${slug}): ${head}${pairs.join('; ')}`)
            count++
          }
        } else if (payload.worksheet) {
          lines.push(`- Day ${dayNum ?? '?'} exercise (${slug}): worksheet completed`)
          count++
        } else if (payload.selected_option != null) {
          const label = payload.selected_label
            ? ` "${clip(String(payload.selected_label), 80)}"`
            : ` option ${payload.selected_option}`
          const head = q ? ` Q: "${clip(q, 80)}"` : ''
          lines.push(`- Day ${dayNum ?? '?'} quiz (${slug}):${head} →${label}`)
          count++
        } else if (payload.completed) {
          // skip empty completions — no user language for personalization
        }
        if (count >= 12) break
      }

      if (count === 0) lines.push('- No saved reflections or exercise data yet.')
      return lines.join('\n')
    } catch {
      return 'USER INPUT HISTORY:\n- Unavailable.'
    }
  }

  async getComprehensionStats(userId: string): Promise<{ attempts: number; passes: number }> {
    try {
      const rows = await pb.collection('session_ai_memory').getList(1, 50, {
        filter: `user = "${userId}" && record_type = "comprehension_check"`,
      })
      const items = rows.items as unknown as SessionAiMemoryRow[]
      return {
        attempts: items.length,
        passes: items.filter(r => r.is_correct).length,
      }
    } catch {
      return { attempts: 0, passes: 0 }
    }
  }

  private async appendRecord(
    userId: string,
    dayNumber: number,
    programDayId: string | undefined,
    recordType: SessionAiRecordType,
    payload: Record<string, unknown>,
    isCorrect?: boolean
  ): Promise<void> {
    try {
      await pb.collection('session_ai_memory').create({
        user: userId,
        day_number: dayNumber,
        record_type: recordType,
        payload_json: payload,
        ...(programDayId ? { program_day: programDayId } : {}),
        ...(isCorrect !== undefined ? { is_correct: isCorrect } : {}),
      })
    } catch (e) {
      console.warn(`[SessionPersonalization] ${recordType} save failed:`, e)
    }
  }
}

export const sessionPersonalizationService = new SessionPersonalizationService()
