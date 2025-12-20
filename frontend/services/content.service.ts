import { BaseService } from './base.service'
import { ContentItem } from '../types/models'
import { ApiResponse } from '../types/api'
import { ContentType, Language } from '../types/enums'

export class ContentService extends BaseService {
  constructor() {
    super('content_items')
  }

  /**
   * Get content by type
   */
  async getByType(
    type: ContentType,
    language: Language = Language.EN,
    options?: { limit?: number; sort?: string }
  ): Promise<ApiResponse<ContentItem[]>> {
    try {
      const filter = `type = "${type}" && language = "${language}" && is_active = true`
      const getAllOptions: any = {
        filter,
        sort: options?.sort || 'order',
      }
      if (options?.limit) {
        getAllOptions.limit = options.limit
      }
      return await this.getAll(getAllOptions)
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Get random quote
   */
  async getRandomQuote(language: Language = Language.EN): Promise<ApiResponse<ContentItem>> {
    try {
      const result = await this.getByType(ContentType.QUOTE, language)
      if (!result.success || !result.data || result.data.length === 0) {
        return { success: false, error: 'No quotes available' }
      }

      const randomIndex = Math.floor(Math.random() * result.data.length)
      return { success: true, data: result.data[randomIndex] }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Get article of the day (cached per day)
   */
  async getArticleOfTheDay(language: Language = Language.EN): Promise<ApiResponse<ContentItem>> {
    try {
      const cacheKey = `article_of_day_${language}_${new Date().toDateString()}`
      const cached = localStorage.getItem(cacheKey)

      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          return { success: true, data: parsed }
        } catch {
          // Invalid cache, continue to fetch
        }
      }

      const result = await this.getByType(ContentType.ARTICLE, language, { limit: 10 })
      if (!result.success || !result.data || result.data.length === 0) {
        return { success: false, error: 'No articles available' }
      }

      // Pick random article for the day
      const dayOfYear = Math.floor(
        (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
      )
      const articleIndex = dayOfYear % result.data.length
      const article = result.data[articleIndex]

      // Cache for today
      localStorage.setItem(cacheKey, JSON.stringify(article))

      return { success: true, data: article }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Get daily tip
   */
  async getDailyTip(language: Language = Language.EN): Promise<ApiResponse<ContentItem>> {
    try {
      const result = await this.getByType(ContentType.TIP, language, { limit: 30 })
      if (!result.success || !result.data || result.data.length === 0) {
        return { success: false, error: 'No tips available' }
      }

      // Pick tip based on day of year for consistency
      const dayOfYear = Math.floor(
        (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
      )
      const tipIndex = dayOfYear % result.data.length
      return { success: true, data: result.data[tipIndex] }
    } catch (error: any) {
      return this.handleError(error)
    }
  }
}

export const contentService = new ContentService()

