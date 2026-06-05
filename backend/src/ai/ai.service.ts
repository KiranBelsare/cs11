import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FaqEmbeddingsService } from './faq-embeddings.service'

export interface MatchResult {
  id: string
  confidence: number
  explanation?: string
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)
  private readonly confidenceThreshold: number

  constructor(
    private readonly faqEmbeddings: FaqEmbeddingsService,
    private readonly configService: ConfigService,
  ) {
    this.confidenceThreshold = this.configService.get<number>('AI_CONFIDENCE_THRESHOLD', 0.75)
  }

  /**
   * Match a question string against stored FAQ embeddings.
   * Returns the top matches (ranked by cosine similarity) regardless of confidence,
   * so callers can decide what to do with low-confidence results.
   */
  async findMatches(dto: { question: string; tags?: string[]; category?: string }): Promise<{ matches: MatchResult[] }> {
    try {
      const result = await this.faqEmbeddings.findBestMatch(dto.question, this.confidenceThreshold)

      if (!result) {
        return { matches: [] }
      }

      return {
        matches: [
          {
            id: result.faqId,
            confidence: result.confidence,
          },
        ],
      }
    } catch (error) {
      this.logger.error(`AI match failed: ${(error as Error).message}`)
      return { matches: [] }
    }
  }

  async isConfidentEnough(response: { matches: MatchResult[] }): Promise<boolean> {
    if (!response.matches || response.matches.length === 0) return false
    return response.matches[0].confidence >= this.confidenceThreshold
  }
}