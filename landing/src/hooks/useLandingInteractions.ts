import { useEffect } from 'react'
import { APP_START_PATH, appHref, goToApp } from '../lib/appUrl'
import { initHeroCanvas } from '../lib/heroCanvas'
import { initStoryScroll } from '../lib/storyScroll'
import { initInteractiveMockup } from '../lib/interactiveMockup'
import { initBarAnimations } from '../lib/barAnimations'

const PAYWALL_DAILY_CIGS = 10

/**
 * Wires DOM interactions for the marketing page (nav, FAQ, pricing, CTAs, light canvas).
 * ponytail: event delegation over per-button React handlers — markup stays section-split without prop drilling.
 */
export function useLandingInteractions() {
  useEffect(() => {
    const cleanups: Array<() => void> = []

    // App CTAs + deep links (rewrite href for local→:5175 vs prod app host)
    document.querySelectorAll<HTMLElement>('[data-app-link]').forEach((el) => {
      const path = el.dataset.appLink
      if (path && el instanceof HTMLAnchorElement) el.href = appHref(path)
    })
    document.querySelectorAll<HTMLAnchorElement>('a.js-start-app').forEach((el) => {
      el.href = appHref(APP_START_PATH)
    })

    const onStartClick = (e: Event) => {
      const target = (e.target as HTMLElement | null)?.closest('.js-start-app')
      if (!target) return
      e.preventDefault()
      goToApp(APP_START_PATH)
    }
    document.addEventListener('click', onStartClick)
    cleanups.push(() => document.removeEventListener('click', onStartClick))

    // Quit coach mailto (buttons); anchors with mailto: work natively
    const onCoach = (e: Event) => {
      const target = (e.target as HTMLElement | null)?.closest('.nav-coach')
      if (!target) return
      if (target instanceof HTMLAnchorElement && target.href.startsWith('mailto:')) return
      e.preventDefault()
      window.location.href = 'mailto:support@smono.app'
    }
    document.addEventListener('click', onCoach)
    cleanups.push(() => document.removeEventListener('click', onCoach))

    // Nav scroll + mobile menu + live header height (homepage or blog chrome)
    const siteHeader =
      document.querySelector<HTMLElement>('.site-header') ||
      document.querySelector<HTMLElement>('.blog-site-header')
    const nav = document.querySelector('.nav')
    const syncHeaderHeight = () => {
      if (!siteHeader) return
      const h = Math.ceil(siteHeader.getBoundingClientRect().height)
      document.documentElement.style.setProperty('--header-h', `${h}px`)
    }
    syncHeaderHeight()
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncHeaderHeight) : null
    if (siteHeader && ro) ro.observe(siteHeader)
    window.addEventListener('resize', syncHeaderHeight)
    cleanups.push(() => {
      ro?.disconnect()
      window.removeEventListener('resize', syncHeaderHeight)
    })

    const onScroll = () => {
      nav?.classList.toggle('scrolled', window.scrollY > 50)
      siteHeader?.classList.toggle('is-scrolled', window.scrollY > 50)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    cleanups.push(() => window.removeEventListener('scroll', onScroll))

    const hamburger = document.querySelector('.nav-hamburger')
    const mobileMenu = document.querySelector('.mobile-menu')
    const closeMenu = () => {
      hamburger?.classList.remove('open')
      mobileMenu?.classList.remove('open')
      hamburger?.setAttribute('aria-expanded', 'false')
      document.body.classList.remove('menu-open')
      syncHeaderHeight()
    }
    const toggleMenu = () => {
      const open = !mobileMenu?.classList.contains('open')
      hamburger?.classList.toggle('open', open)
      mobileMenu?.classList.toggle('open', open)
      hamburger?.setAttribute('aria-expanded', open ? 'true' : 'false')
      document.body.classList.toggle('menu-open', open)
      syncHeaderHeight()
    }
    hamburger?.addEventListener('click', toggleMenu)
    cleanups.push(() => hamburger?.removeEventListener('click', toggleMenu))
    mobileMenu?.querySelectorAll('a, .js-start-app, .nav-coach').forEach((link) => {
      link.addEventListener('click', closeMenu)
      cleanups.push(() => link.removeEventListener('click', closeMenu))
    })

    // Scroll reveal — fade/slide in as sections enter the viewport
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const reveals = document.querySelectorAll<HTMLElement>('.reveal')
    if (reduced) {
      reveals.forEach((el) => el.classList.add('visible'))
    } else {
      reveals.forEach((el) => el.classList.remove('visible'))
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const el = entry.target as HTMLElement
            if (entry.isIntersecting) {
              const delay = Number(el.dataset.delay || 0)
              window.setTimeout(() => el.classList.add('visible'), delay)
            } else if (entry.boundingClientRect.top > window.innerHeight * 0.9) {
              // only reset when scrolling back up past the section
              el.classList.remove('visible')
            }
          })
        },
        { threshold: 0.08, rootMargin: '0px 0px -4% 0px' }
      )
      reveals.forEach((el) => {
        const parent = el.parentElement
        const siblings = parent ? Array.from(parent.querySelectorAll(':scope > .reveal')) : []
        const idx = siblings.indexOf(el)
        if (idx > 0) el.dataset.delay = String(idx * 90)
        revealObserver.observe(el)
      })
      cleanups.push(() => revealObserver.disconnect())
    }

    // FAQ accordion — CSS grid-template-rows handles open/close (no max-height layout anim)
    const onFaq = (e: Event) => {
      const btn = (e.target as HTMLElement | null)?.closest('.faq-question')
      if (!btn) return
      const item = btn.parentElement
      if (!item) return
      const isOpen = item.classList.contains('open')
      document.querySelectorAll('.faq-item.open').forEach((openItem) => {
        openItem.classList.remove('open')
        openItem.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false')
      })
      if (!isOpen) {
        item.classList.add('open')
        btn.setAttribute('aria-expanded', 'true')
      }
    }
    document.addEventListener('click', onFaq)
    cleanups.push(() => document.removeEventListener('click', onFaq))

    // Border glow hover
    const glowCards = document.querySelectorAll<HTMLElement>('.border-glow, .step-card')
    glowCards.forEach((card) => {
      const move = (e: MouseEvent) => {
        const r = card.getBoundingClientRect()
        card.style.setProperty('--mouse-x', `${((e.clientX - r.left) / r.width) * 100}%`)
        card.style.setProperty('--mouse-y', `${((e.clientY - r.top) / r.height) * 100}%`)
      }
      const leave = () => {
        card.style.setProperty('--mouse-x', '-1000%')
        card.style.setProperty('--mouse-y', '-1000%')
      }
      card.addEventListener('mousemove', move)
      card.addEventListener('mouseleave', leave)
      cleanups.push(() => {
        card.removeEventListener('mousemove', move)
        card.removeEventListener('mouseleave', leave)
      })
    })

    // Ghost “see how” scroll
    document.querySelectorAll('.btn-ghost').forEach((btn) => {
      if (!btn.textContent?.includes('See How')) return
      const go = (e: Event) => {
        e.preventDefault()
        document.getElementById('reset-story')?.scrollIntoView({ behavior: 'smooth' })
      }
      btn.addEventListener('click', go)
      cleanups.push(() => btn.removeEventListener('click', go))
    })

    // Pricing + optional canvases
    let cancelled = false
    let mockupCleanup: (() => void) | null = null
    let selectedCountry = 'IN'
    ;(async () => {
      const { detectCountryCode, formatMoney, getCountryConfig } = await import('../lib/pricing')
      const { startLandingCheckout, previewLandingCoupon } = await import('../lib/payment')

      const code = await detectCountryCode()
      if (cancelled) return
      selectedCountry = code
      let appliedCoupon = ''
      let appliedDisplay = ''

      const applyPricing = (cc: string) => {
        selectedCountry = cc
        const config = getCountryConfig(cc)
        const listPromo = formatMoney(config.subscriptionPrice, config)
        const promo = appliedDisplay || listPromo
        const original = formatMoney(config.subscriptionOriginal, config)
        const dailySpend = PAYWALL_DAILY_CIGS * config.pricePerCigarette
        const equivalentDays = Math.max(1, Math.round(config.subscriptionPrice / dailySpend))
        const badTotal = formatMoney(dailySpend * equivalentDays, config)

        const set = (id: string, text: string) => {
          const el = document.getElementById(id)
          if (el) el.textContent = text
        }
        set('priceOriginal', original)
        set('comparisonBadTitle', `${equivalentDays} Days of Cigarettes`)
        set('priceComparisonBad', badTotal)
        set('priceComparisonGood', promo)
        set('priceSavingsText', `Less than ${equivalentDays} days of cigarettes. Pays for itself in a week.`)
        set('pricePayLabel', promo)

        const promoEl = document.getElementById('pricePromo')
        if (promoEl) {
          promoEl.innerHTML = `${promo}<span style="font-size:1.1rem;font-weight:500;color:var(--muted)">/month</span>`
        }
      }

      applyPricing(selectedCountry)

      const payBtn = document.getElementById('pricePayCta') as HTMLButtonElement | null
      const errEl = document.getElementById('pricePayError')
      const couponEl = document.getElementById('priceCoupon') as HTMLInputElement | null
      const applyBtn = document.getElementById('priceCouponApply') as HTMLButtonElement | null
      const hintEl = document.getElementById('priceCouponHint')

      const onApplyCoupon = async () => {
        const raw = couponEl?.value?.trim() || ''
        if (!raw) {
          if (hintEl) {
            hintEl.hidden = false
            hintEl.classList.add('is-error')
            hintEl.textContent = 'Enter a coupon code'
          }
          return
        }
        if (applyBtn) applyBtn.disabled = true
        try {
          const preview = await previewLandingCoupon(selectedCountry, raw)
          const config = getCountryConfig(selectedCountry)
          appliedCoupon = preview.coupon
          appliedDisplay = formatMoney(preview.display_amount, config)
          if (couponEl) couponEl.value = preview.coupon
          if (hintEl) {
            hintEl.hidden = false
            hintEl.classList.remove('is-error')
            hintEl.textContent = `${preview.coupon} · ${preview.percent_off}% off`
          }
          applyPricing(selectedCountry)
          if (payBtn) {
            payBtn.innerHTML = `Pay & unlock — <span id="pricePayLabel">${appliedDisplay}</span>`
          }
        } catch (err: any) {
          appliedCoupon = ''
          appliedDisplay = ''
          applyPricing(selectedCountry)
          if (hintEl) {
            hintEl.hidden = false
            hintEl.classList.add('is-error')
            hintEl.textContent = String(err?.message || 'Invalid coupon')
          }
        } finally {
          if (applyBtn) applyBtn.disabled = false
        }
      }

      applyBtn?.addEventListener('click', onApplyCoupon)
      cleanups.push(() => applyBtn?.removeEventListener('click', onApplyCoupon))
      couponEl?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onApplyCoupon()
        }
      })

      const onPay = async () => {
        if (!payBtn || payBtn.disabled) return
        if (errEl) {
          errEl.hidden = true
          errEl.textContent = ''
        }
        payBtn.disabled = true
        payBtn.textContent = 'Opening checkout…'
        try {
          const coupon = couponEl?.value?.trim() || appliedCoupon || ''
          await startLandingCheckout(selectedCountry, coupon)
        } catch (err: any) {
          const msg = String(err?.message || 'Payment failed')
          if (msg !== 'Payment cancelled' && errEl) {
            errEl.hidden = false
            errEl.textContent = msg
          }
        } finally {
          payBtn.disabled = false
          applyPricing(selectedCountry)
          if (payBtn) {
            const promo = document.getElementById('pricePayLabel')?.textContent || appliedDisplay || ''
            payBtn.innerHTML = `Pay & unlock — <span id="pricePayLabel">${promo}</span>`
            applyPricing(selectedCountry)
          }
        }
      }
      payBtn?.addEventListener('click', onPay)
      cleanups.push(() => payBtn?.removeEventListener('click', onPay))

      if (!cancelled) mockupCleanup = initInteractiveMockup(getCountryConfig(selectedCountry))
    })()

    if (!reduced) {
      cleanups.push(initHeroCanvas())
    }
    // Journey timeline + canvas (canvas no-ops under reduced motion)
    cleanups.push(initStoryScroll())
    cleanups.push(initBarAnimations())

    return () => {
      cancelled = true
      mockupCleanup?.()
      cleanups.forEach((fn) => fn())
    }
  }, [])
}
