import { type ReactNode } from 'react'
import { BlogSiteChrome } from './BlogSiteChrome'
import { useLandingInteractions } from '../hooks/useLandingInteractions'
import { usePageSeo } from '../hooks/usePageSeo'

type Props = {
  title: string
  description: string
  canonicalPath: string
  eyebrow?: string
  h1?: string
  lead?: string
  /** Set false for single-CTA pages whose content section is its own hero. */
  hero?: boolean
  /** Buy-first CTAs (checkout instead of free Day 1). */
  buyMode?: boolean
  children: ReactNode
}

export function MarketingPage({
  title,
  description,
  canonicalPath,
  eyebrow,
  h1,
  lead,
  hero = true,
  buyMode = false,
  children,
}: Props) {
  useLandingInteractions({ buyMode })
  usePageSeo({ title, description, canonicalPath })

  return (
    <BlogSiteChrome>
      <div className="marketing-page">
        {hero && h1 ? (
          <section className="about-hero">
            <div className="container">
              <div className="about-surface about-hero-card">
                {eyebrow ? <p className="about-eyebrow">{eyebrow}</p> : null}
                <h1 className="about-title">{h1}</h1>
                {lead ? <p className="about-lead">{lead}</p> : null}
              </div>
            </div>
          </section>
        ) : null}
        {children}
      </div>
    </BlogSiteChrome>
  )
}
