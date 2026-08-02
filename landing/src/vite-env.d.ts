/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_META_PIXEL_ID?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  fbq?: (...args: unknown[]) => void
  _fbq?: unknown
  __smonoMetaPixelInited?: boolean
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
  __smonoGaInited?: boolean
}
