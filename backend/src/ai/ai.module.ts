import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AiService } from './ai.service'
import { AiController } from './ai.controller'
import { EmbeddingsService } from './embeddings.service'
import { FaqEmbeddingsService } from './faq-embeddings.service'
import { FaqEmbedding, FaqEmbeddingSchema } from './schemas/faq-embeddings.schema'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: FaqEmbedding.name, schema: FaqEmbeddingSchema }]),
  ],
  providers: [AiService, EmbeddingsService, FaqEmbeddingsService],
  controllers: [AiController],
  exports: [AiService, EmbeddingsService, FaqEmbeddingsService],
})
export class AiModule {}