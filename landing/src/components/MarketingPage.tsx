import { type ReactNode } from 'react'
import { BlogSiteChrome } from './BlogSiteChrome'
import { useLandingInteractions } from '../hooks/useLandingInteractions'
import { usePageSeo } from '../hooks/usePageSeo'

type Props = {
  title: string
  description: string
  canonicalPath: string
  eyebrow?: string
  h1: string
  lead?: string
  children: ReactNode
}

export function MarketingPage({ title, description, canonicalPath, eyebrow, h1, lead, children }: Props) {
  useLandingInteractions()
  usePageSeo({ title, description, canonicalPath })

  return (
    <BlogSiteChrome>
      <div className="marketing-page">
        <section className="about-hero">
          <div className="container">
            <div className="about-surface about-hero-card">
              {eyebrow ? <p className="about-eyebrow">{eyebrow}</p> : null}
              <h1 className="about-title">{h1}</h1>
              {lead ? <p className="about-lead">{lead}</p> : null}
            </div>
          </div>
        </section>
        {children}
      </div>
    </BlogSiteChrome>
  )
}
