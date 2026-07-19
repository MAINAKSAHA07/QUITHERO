import { prepareBlogHtml } from '../utils/prepareBlogHtml'

type Props = { content: string }

/** Renders CMS HTML body. Full documents are stripped to <main> + scoped CSS. */
export function BlogBody({ content }: Props) {
  if (!content) return null
  const html = prepareBlogHtml(content)
  if (!html) return null
  return <div className="blog-content" dangerouslySetInnerHTML={{ __html: html }} />
}
