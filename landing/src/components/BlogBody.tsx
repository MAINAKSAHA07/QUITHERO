type Props = { content: string }

/** Renders CMS HTML body (same pattern as language-network blog detail). */
export function BlogBody({ content }: Props) {
  if (!content) return null
  return (
    <div
      className="blog-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
