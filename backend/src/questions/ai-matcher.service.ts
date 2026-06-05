import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FaqEmbeddingsService } from '../ai/faq-embeddings.service'

interface AiMatchResult {
  matched: boolean
  faqId?: string
  confidence?: number
}

@Injectable()
export class AiMatcherService {
  private readonly logger = new Logger(AiMatcherService.name)
  private readonly confidenceThreshold: number

  constructor(
    private readonly faqEmbeddings: FaqEmbeddingsService,
    private readonly configService: ConfigService,
  ) {
    this.confidenceThreshold = this.configService.get<number>('AI_CONFIDENCE_THRESHOLD', 0.75)
  }

  /**
   * Match a question string against stored FAQ embeddings using Ollama + cosine similarity.
   * Returns the best match above the configured confidence threshold, or { matched: false }.
   */
  async match(query: string): Promise<AiMatchResult> {
    try {
      const result = await this.faqEmbeddings.findBestMatch(query, this.confidenceThreshold)

      if (!result) {
        return { matched: false }
      }

      return {
        matched: true,
        faqId: result.faqId,
        confidence: result.confidence,
      }
    } catch (error) {
      this.logger.warn(`AI match failed: ${(error as Error).message}. Allowing question to proceed.`)
      return { matched: false }
    }
  }
}