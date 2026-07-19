/**
 * Client translation via Google Translate public endpoint (no API key).
 * Short UI strings + chunked longer lesson bodies.
 */
export class TranslationService {
  private cache: Map<string, string> = new Map()
  private readonly GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single'
  // ponytail: GET URL length ceiling — chunk above this; upgrade to POST /api/translate if blocked/ratelimited
  private readonly CHUNK = 900

  private normalizeLang(code: string): string {
    if (code === 'zh') return 'zh-CN'
    return code || 'en'
  }

  private extractJoined(data: unknown): string | null {
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null
    const parts = (data[0] as unknown[])
      .map((seg) => (Array.isArray(seg) ? seg[0] : null))
      .filter((s): s is string => typeof s === 'string' && s.length > 0)
    return parts.length ? parts.join('') : null
  }

  private async translateChunk(
    text: string,
    targetLang: string,
    sourceLang: string
  ): Promise<string> {
    const cacheKey = `${sourceLang}-${targetLang}-${text}`
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!

    const url = `${this.GOOGLE_TRANSLATE_URL}?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Translation API error: ${response.status}`)
    const data = await response.json()
    const translatedText = this.extractJoined(data) || text
    this.cache.set(cacheKey, translatedText)
    return translatedText
  }

  async translate(
    text: string,
    targetLang: string = 'en',
    sourceLang: string = 'en'
  ): Promise<string> {
    const tl = this.normalizeLang(targetLang)
    const sl = this.normalizeLang(sourceLang)
    if (sl === tl || !text?.trim()) return text

    const cacheKey = `${sl}-${tl}-${text}`
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!

    try {
      if (text.length <= this.CHUNK) {
        return await this.translateChunk(text, tl, sl)
      }

      // Split on paragraph breaks so markdown/list structure survives
      const paragraphs = text.split(/(\n\n+)/)
      const out: string[] = []
      let buf = ''
      const flush = async () => {
        if (!buf) return
        out.push(await this.translateChunk(buf, tl, sl))
        buf = ''
      }
      for (const part of paragraphs) {
        if (!part) continue
        if (buf.length + part.length > this.CHUNK && buf) await flush()
        if (part.length > this.CHUNK) {
          await flush()
          // Force-split runaway chunks
          for (let i = 0; i < part.length; i += this.CHUNK) {
            out.push(await this.translateChunk(part.slice(i, i + this.CHUNK), tl, sl))
          }
        } else {
          buf += part
        }
      }
      await flush()
      const joined = out.join('')
      this.cache.set(cacheKey, joined)
      return joined
    } catch {
      return text
    }
  }

  async translateBatch(
    texts: string[],
    targetLang: string = 'en',
    sourceLang: string = 'en'
  ): Promise<string[]> {
    return Promise.all(texts.map((text) => this.translate(text, targetLang, sourceLang)))
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheSize(): number {
    return this.cache.size
  }
}

export const translationService = new TranslationService()
