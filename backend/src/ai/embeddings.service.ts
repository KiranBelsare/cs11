import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'

/**
 * Embedding provider interface.
 * Implementations:
 *  - Ollama (local, default) — runs a local model via HTTP
 *  - Mock (dev/test only) — returns deterministic pseudo-vectors so matching works without external deps
 */
export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>
  embedSingle(text: string): Promise<number[]>
}

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name)
  private readonly provider: EmbeddingProvider

  constructor(private readonly configService: ConfigService) {
    const providerType = this.configService.get<string>('EMBEDDING_PROVIDER', 'ollama')

    if (providerType === 'mock') {
      this.logger.warn('EMBEDDING_PROVIDER=mock — using deterministic pseudo-embeddings (dev/test only)')
      this.provider = new MockProvider()
    } else {
      // Default: Ollama
      this.provider = new OllamaProvider(
        this.configService.get<string>('OLLAMA_URL', 'http://localhost:11434'),
        this.configService.get<string>('OLLAMA_EMBEDDING_MODEL', 'nomic-embed-text'),
        this.logger,
      )
    }
  }

  /**
   * Generate an embedding for a single text string.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    return this.provider.embedSingle(text)
  }

  /**
   * Generate embeddings for multiple texts.
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    return this.provider.embed(texts)
  }
}

// ─── Ollama Provider ──────────────────────────────────────────────────────────

class OllamaProvider implements EmbeddingProvider {
  private readonly client: AxiosInstance
  private readonly model: string
  private readonly logger: Logger

  constructor(baseUrl: string, model: string, logger: Logger) {
    this.client = axios.create({ baseURL: baseUrl, timeout: 60_000 })
    this.model = model
    this.logger = logger
  }

  async embedSingle(text: string): Promise<number[]> {
    try {
      const response = await this.client.post<{ embedding: number[] }>('/api/embeddings', {
        model: this.model,
        prompt: text,
      })
      return response.data.embedding
    } catch (error) {
      this.logger.error(`Ollama embed failed: ${(error as Error).message}`)
      throw error
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    const results: number[][] = []
    for (const text of texts) {
      try {
        const response = await this.client.post<{ embedding: number[] }>('/api/embeddings', {
          model: this.model,
          prompt: text,
        })
        results.push(response.data.embedding)
      } catch (error) {
        this.logger.error(`Ollama embed failed for "${text.slice(0, 40)}...": ${(error as Error).message}`)
        results.push([])
      }
    }
    return results
  }
}

// ─── Mock Provider (dev/test only) ───────────────────────────────────────────

/**
 * Deterministic pseudo-embeddings for environments without Ollama.
 * Produces a 384-dim float vector derived from the input text's hash.
 * The same text always produces the same vector, so matching tests work.
 *
 * NOT for production.
 */
class MockProvider implements EmbeddingProvider {
  private readonly DIM = 384

  async embedSingle(text: string): Promise<number[]> {
    return this.buildVector(text)
  }

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.buildVector(t))
  }

  private buildVector(text: string): number[] {
    // Simple splitmix32 hash to seed a deterministic LCG
    let seed = this.hashStr(text)
    const rng = () => {
      seed = (seed + 0x6d2b79f5) | 0
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    // Produce a normalised vector so cosine similarity is meaningful
    const raw = Array.from({ length: this.DIM }, () => rng() * 2 - 1)
    const norm = Math.sqrt(raw.reduce((s, v) => s + v * v, 0))
    return norm === 0 ? raw : raw.map((v) => v / norm)
  }

  private hashStr(s: string): number {
    let h = 0
    for (let i = 0; i < s.length; i++) {
      h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
    }
    return h >>> 0
  }
}