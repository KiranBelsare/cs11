import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { InjectModel, InjectConnection } from '@nestjs/mongoose'
import { Model, Types, Connection } from 'mongoose'
import { FAQ, FaqDocument } from './faq.schema'
import { CreateFaqDto } from './dtos/create-faq.dto'
import { UpdateFaqDto } from './dtos/update-faq.dto'
import { FaqEmbeddingsService } from '../ai/faq-embeddings.service'
import { EventsGateway } from '../events/events.gateway'

@Injectable()
export class FaqsService {
  private readonly logger = new Logger(FaqsService.name)

  constructor(
    @InjectModel(FAQ.name) private faqModel: Model<FaqDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly faqEmbeddings: FaqEmbeddingsService,
    private readonly events: EventsGateway,
  ) {}

  // Resolve a category slug → ObjectId. Returns null if not found.
  private async resolveCategorySlug(slug: string): Promise<Types.ObjectId | null> {
    const doc = await this.connection
      .collection('categories')
      .findOne({ slug }, { projection: { _id: 1 } })
    return doc ? doc._id as Types.ObjectId : null
  }

  async create(dto: CreateFaqDto, authorId: string): Promise<FaqDocument> {
    const faq = new this.faqModel({
      ...dto,
      author: new Types.ObjectId(authorId),
      status: 'published',
    })
    const saved = await faq.save()

    this.faqEmbeddings.upsert(saved._id.toString(), saved.title, saved.body).catch((err) => {
      this.logger.error(`Failed to index FAQ ${saved._id} for AI matching: ${err.message}`)
    })

    this.events.emitFaqPublished(saved.toObject())

    return saved
  }

  async findAll(filters: {
    category?: string
    tags?: string[]
    status?: string
    page?: number
    limit?: number
    isAdmin?: boolean
    search?: string
  }): Promise<{ data: FaqDocument[]; totalCount: number; page: number }> {
    const { category, tags, status, page = 1, limit = 20, isAdmin = false, search } = filters

    const skip = (page - 1) * limit
    const query: Record<string, unknown> = {}

    if (status) {
      query.status = status
    } else if (!isAdmin) {
      query.status = 'published'
    }

    if (category) {
      // category is a slug string — resolve to ObjectId first
      const categoryId = await this.resolveCategorySlug(category)
      if (categoryId) {
        query.category = categoryId
      } else {
        // Unknown slug — return empty result set
        query.category = new Types.ObjectId('000000000000000000000000')
      }
    }

    if (tags && tags.length > 0) {
      query.tags = { $all: tags }
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ]
    }

    const [data, totalCount] = await Promise.all([
      this.faqModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('author', 'name email role')
        .populate('category', 'name slug color')
        .populate('resolvedBy', 'name email')
        .exec(),
      this.faqModel.countDocuments(query).exec(),
    ])

    return { data, totalCount, page }
  }

  async findById(id: string): Promise<FaqDocument> {
    const faq = await this.faqModel
      .findByIdAndUpdate(id, { $inc: { viewCount: 1 } }, { new: true })
      .populate('author', 'name email role')
      .populate('category', 'name slug color')
      .populate('resolvedBy', 'name email')
      .exec()

    if (!faq) throw new NotFoundException('FAQ not found')
    return faq
  }

  async update(id: string, dto: UpdateFaqDto): Promise<FaqDocument> {
    const faq = await this.faqModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .populate('author', 'name email role')
      .populate('category', 'name slug color')
      .populate('resolvedBy', 'name email')
      .exec()

    if (!faq) throw new NotFoundException('FAQ not found')

    this.faqEmbeddings.upsert(faq._id.toString(), faq.title, faq.body).catch((err) => {
      this.logger.error(`Failed to re-index FAQ ${faq!._id} for AI matching: ${err.message}`)
    })

    return faq
  }

  async archive(id: string): Promise<FaqDocument> {
    const faq = await this.faqModel
      .findByIdAndUpdate(id, { $set: { status: 'archived' } }, { new: true })
      .populate('author', 'name email role')
      .populate('category', 'name slug color')
      .exec()

    if (!faq) throw new NotFoundException('FAQ not found')

    this.faqEmbeddings.removeEmbedding(faq._id.toString()).catch((err) => {
      this.logger.error(`Failed to remove archived FAQ ${faq!._id} from AI index: ${err.message}`)
    })

    this.events.emitFaqPublished(faq.toObject())

    return faq
  }
}