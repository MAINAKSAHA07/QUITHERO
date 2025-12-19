/**
 * Translation Service using Google Translate Web API
 * Handles text translation between languages
 * Uses Google Translate's free web API (no API key required)
 */
export class TranslationService {
  private cache: Map<string, string> = new Map()
  private readonly GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single'

  /**
   * Translate text to target language using Google Translate Web API
   * @param text - Text to translate
   * @param targetLang - Target language code (e.g., 'en', 'hi', 'es', 'fr')
   * @param sourceLang - Source language code (default: 'en')
   * @returns Translated text
   */
  async translate(
    text: string,
    targetLang: string = 'en',
    sourceLang: string = 'en'
  ): Promise<string> {
    // Return original text if same language
    if (sourceLang === targetLang || !text || text.trim() === '') {
      return text
    }

    // Check cache first
    const cacheKey = `${sourceLang}-${targetLang}-${text}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    try {
      // Use Google Translate's free web API
      const url = `${this.GOOGLE_TRANSLATE_URL}?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Extract translated text from response
      // Response format: [[["translated text", "original text", null, null, 0]], null, "en"]
      const translatedText = data[0]?.[0]?.[0] || text
      
      // Cache the result
      this.cache.set(cacheKey, translatedText)
      
      return translatedText
    } catch (error) {
      console.error('Translation service error:', error)
      // Return original text on error
      return text
    }
  }

  /**
   * Translate multiple texts at once
   * @param texts - Array of texts to translate
   * @param targetLang - Target language code
   * @param sourceLang - Source language code
   * @returns Array of translated texts
   */
  async translateBatch(
    texts: string[],
    targetLang: string = 'en',
    sourceLang: string = 'en'
  ): Promise<string[]> {
    const translations = await Promise.all(
      texts.map(text => this.translate(text, targetLang, sourceLang))
    )
    return translations
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size
  }
}

// Export singleton instance
export const translationService = new TranslationService()
