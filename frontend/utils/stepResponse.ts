/** Denormalize step prompt onto the saved payload so admin/AI can read Q without joining. */
export function withStoredQuestion(
  step: {
    type?: string
    slug?: string
    step_title?: string
    content_json?: unknown
  },
  response: unknown
): Record<string, unknown> {
  const base: Record<string, unknown> =
    response && typeof response === 'object' && !Array.isArray(response)
      ? { ...(response as Record<string, unknown>) }
      : { value: response }

  const content =
    step.content_json && typeof step.content_json === 'object' && !Array.isArray(step.content_json)
      ? (step.content_json as Record<string, unknown>)
      : {}

  const question = String(
    content.question || content.prompt || content.instructions || content.text || step.step_title || ''
  )
    .replace(/\s+/g, ' ')
    .trim()

  if (question) base.question = question
  if (step.step_title) base.step_title = step.step_title
  else if (step.slug) base.step_title = step.slug
  if (step.type) base.step_type = step.type

  if (typeof base.selected_option === 'number' && Array.isArray(content.options)) {
    const label = content.options[base.selected_option as number]
    if (label != null) base.selected_label = String(label)
  }

  return base
}
