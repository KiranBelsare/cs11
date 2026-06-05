import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type FaqEmbeddingDocument = FaqEmbedding & Document

@Schema({ timestamps: false, versionKey: false })
export class FaqEmbedding {
  /** Reference to the parent FAQ document */
  @Prop({ type: Types.ObjectId, ref: 'FAQ', required: true, unique: true })
  faqId: Types.ObjectId

  /** Title at time of embedding — kept for debug / logging */
  @Prop({ required: true })
  title: string

  /** Body at time of embedding — the primary embedding source */
  @Prop({ required: true })
  body: string

  /**
   * 384-dimensional embedding vector generated via Ollama (nomic-embed-text).
   * Stored as a plain array of floats so cosine similarity can be computed in JS.
   */
  @Prop({ type: [Number], required: true })
  embedding: number[]
}

export const FaqEmbeddingSchema = SchemaFactory.createForClass(FaqEmbedding)