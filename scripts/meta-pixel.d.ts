export function getMetaPixelId(): string
export function ensureMetaPixel(): boolean
export function trackMetaPageView(): void
export function trackMetaEvent(
  eventName: string,
  params?: Record<string, unknown>
): void
