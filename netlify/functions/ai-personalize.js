import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-haiku-4-5'
const MAX_TOKENS = 900
const TEMPERATURE = 0.7

// ponytail: in-memory rate limiting; resets on serverless cold starts. Upgrade to Redis or query personalization_logs in PocketBase if abused.

const rateLimits = new Map()

function checkRateLimit(userId, requestType) {
  const now = Date.now()
  const key = userId

  if (!rateLimits.has(key) || rateLimits.get(key).resetAt < now) {
    const midnight = new Date()
    midnight.setUTCHours(24, 0, 0, 0)
    rateLimits.set(key, { counts: {}, resetAt: midnight.getTime() })
  }

  const userLimits = rateLimits.get(key)
  const typeLimit = requestType === 'session_content' ? 3 : 5
  const totalLimit = 6

  const typeCount = userLimits.counts[requestType] || 0
  const totalCount = Object.values(userLimits.counts).reduce((a, b) => a + b, 0)

  if (typeCount >= typeLimit || totalCount >= totalLimit) {
    return false
  }

  userLimits.counts[requestType] = typeCount + 1
  return true
}

// ─── Prompt assembly ─────────────────────────────────────────────────────────

function buildSessionSystemPrompt(context) {
  return `You are the personalization engine for Smono, a 30-day CBT-based quit-smoking app.

KNOWLEDGE CONTEXT:
${context.okfContext}

${context.onboardingContext}

ARCHETYPE: ${context.archetype}
${context.behavioralSection}

${context.sessionHistory || 'SESSION MEMORY:\n- No prior session history yet.'}

${context.personalizationRules}

TASK: Generate personalized content insertions for Day ${context.dayNumber}.

HARD RULES:
- Never mention "archetype", "CBT", "personalization", or any system internals to the user
- Never quote back their own words verbatim — translate into insight
- Non-stigmatizing and trauma-informed at all times
- Second-person ("you") when speaking to or asking the user — present tense
- Never phrase journal_prompt, closing_reflection, or any question as first-person ("When did I…", "How do I feel…"). Ask "you" / "your". First-person only inside optional sentence stems the user completes (e.g. "I used to believe…")
- Do not invent facts about the user beyond what is given
- If fear_index is high (>=7): lead with reassurance in the session_intro

TOKEN BUDGET:
- session_intro: max 80 words
- exercise_motivation: max 40 words
- closing_reflection: max 60 words
- journal_prompt: max 20 words
- trigger_check.question: max 25 words
- trigger_check.options: exactly 4 short options
- comprehension_check.question: max 30 words — tests if user understood today's core lesson (not trivia)
- comprehension_check.options: exactly 4 options, one clearly correct based on the day theme
- comprehension_check.correct_index: 0-3 index of the correct option
- comprehension_check.thought_of_the_day: exactly 2 short inspiring lines shown if they answer wrong
- comprehension_check.reread_hint: max 20 words — gentle nudge to re-read earlier content
- Total response must be valid JSON under 700 tokens
- Be concise. Brevity is a feature, not a limitation.

TASK ADDITION — trigger_check:
Generate a brief check-in question about the user's primary trigger (from onboardingContext).
Ask when they last experienced a craving related to their primary trigger.
Options must be exactly: "Today", "Yesterday", "This week", "Not recently"

TASK ADDITION — comprehension_check:
Generate ONE multiple-choice question that checks whether the user understood the main lesson of Program Day ${context.dayNumber} (see KNOWLEDGE CONTEXT day theme).
The wrong options should be plausible misconceptions smokers believe. The correct option reflects the day's CBT insight.
Include a 2-line thought_of_the_day (motivational, personalized to their archetype tone) shown when they pick wrong.

Respond with ONLY valid JSON (no markdown, no preamble):
{
  "session_intro": "...",
  "exercise_motivation": "...",
  "closing_reflection": "...",
  "journal_prompt": "...",
  "trigger_check": {
    "question": "...",
    "options": ["Today", "Yesterday", "This week", "Not recently"]
  },
  "comprehension_check": {
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correct_index": 0,
    "thought_of_the_day": ["First line.", "Second line."],
    "reread_hint": "..."
  }
}`
}

function buildNotificationSystemPrompt(context) {
  const slipLine = context.hasRecentSlip
    ? '- SLIP DETECTED: compassionate only, zero-guilt, frame as data not failure'
    : ''

  return `You are the notification engine for Smono, a 30-day CBT quit-smoking app.

KNOWLEDGE CONTEXT:
${context.okfContext}

${context.onboardingContext}

${context.personalizationRules}

NOTIFICATION CONTEXT:
- Archetype: ${context.archetype}
- Day: ${context.dayNumber}
- Trigger type: ${context.triggerType}
- Has recent slip: ${context.hasRecentSlip || false}
- Recent triggers: ${context.recentTriggers || 'none logged'}
- ${context.behavioralSection}

TASK: Generate ONE notification for trigger type "${context.triggerType}".

HARD RULES:
- NEVER use guilt or shame
- NEVER mention "archetype" or system internals
${slipLine}
- Make it specific to their triggers/motivations where possible
- Actionable — the user should know what to do next

TOKEN BUDGET:
- title: max 8 words (60 character hard limit)
- body: max 18 words (120 character hard limit)
- Do not pad. Short is correct.

Respond with ONLY valid JSON:
{
  "title": "...",
  "body": "..."
}`
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[AI] ANTHROPIC_API_KEY is not set. AI features disabled.')
    return Response.json({ error: 'ai_unavailable', fallback: true }, { status: 503 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid_request', details: 'Invalid JSON body' }, { status: 400 })
  }

  const { userId, requestType, context } = body

  // ── Validation ──────────────────────────────────────────────────────────
  if (!userId || typeof userId !== 'string') {
    return Response.json({ error: 'invalid_request', details: 'userId required' }, { status: 400 })
  }
  if (!['session_content', 'notification'].includes(requestType)) {
    return Response.json({ error: 'invalid_request', details: 'Invalid requestType' }, { status: 400 })
  }
  if (!context || typeof context !== 'object') {
    return Response.json({ error: 'invalid_request', details: 'context object required' }, { status: 400 })
  }
  if (!context.dayNumber || context.dayNumber < 1 || context.dayNumber > 30) {
    return Response.json({ error: 'invalid_request', details: 'dayNumber must be 1-30' }, { status: 400 })
  }

  // ── Rate limiting ───────────────────────────────────────────────────────
  if (!checkRateLimit(userId, requestType)) {
    return Response.json({ error: 'rate_limited', fallback: true }, { status: 429 })
  }

  console.error(`[AI] ${requestType} for user ${userId.slice(0, 8)}... day ${context.dayNumber}`)

  // ── Build prompt ────────────────────────────────────────────────────────
  const systemPrompt = requestType === 'session_content'
    ? buildSessionSystemPrompt(context)
    : buildNotificationSystemPrompt(context)

  // ── Call Claude ─────────────────────────────────────────────────────────
  try {
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      messages: [{ role: 'user', content: 'Generate the personalized content as specified.' }],
      system: systemPrompt,
    })

    const rawText = message.content[0]?.type === 'text' ? message.content[0].text : ''

    let parsed
    try {
      parsed = JSON.parse(rawText)
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    }

    return Response.json(parsed, {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    console.error('[AI] Claude API error:', err.message)
    return Response.json({ error: 'upstream_error', fallback: true }, { status: 502 })
  }
}

export const config = { path: '/api/ai/personalize' }
