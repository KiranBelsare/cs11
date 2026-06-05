import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { InjectConnection } from '@nestjs/mongoose'
import { Model, Types, Connection } from 'mongoose'
import { Question, QuestionDocument } from '../questions/schemas/question.schema'
import { Answer, AnswerDocument } from '../answers/answer.schema'
import { FAQ, FaqDocument } from '../faqs/faq.schema'
import { MetaService } from './meta.service'
import { FaqEmbeddingsService } from '../ai/faq-embeddings.service'

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name)

  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @InjectModel(Answer.name) private answerModel: Model<AnswerDocument>,
    @InjectModel(FAQ.name) private faqModel: Model<FaqDocument>,
    @InjectConnection() private connection: Connection,
    private readonly metaService: MetaService,
    private readonly faqEmbeddings: FaqEmbeddingsService,
  ) {}

  async getQueryQueue(filters: {
    page?: number
    limit?: number
  }): Promise<{ data: Record<string, unknown>[]; totalCount: number; page: number }> {
    const { page = 1, limit = 20 } = filters
    const skip = (page - 1) * limit

    const query = { status: { $in: ['open', 'in_progress'] } }

    const [raw, totalCount] = await Promise.all([
      this.questionModel
        .aggregate([
          { $match: query },
          { $sort: { createdAt: 1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: 'askedBy',
              foreignField: '_id',
              as: 'askedByUser',
            },
          },
          { $unwind: { path: '$askedByUser', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'answers',
              localField: '_id',
              foreignField: 'questionId',
              as: 'answerDocs',
            },
          },
          {
            $project: {
              questionId: { $toString: '$_id' },
              title: 1,
              'askedBy.name': '$askedByUser.name',
              createdAt: 1,
              answerCount: { $size: '$answerDocs' },
            },
          },
        ])
        .exec(),
      this.questionModel.countDocuments(query).exec(),
    ])

    return { data: raw, totalCount, page }
  }

  async resolveQuestion(
    questionId: string,
    dto: { responseBody: string },
    adminUserId: string,
  ): Promise<{ questionId: string; answerId: string }> {
    const session = await this.connection.startSession()
    session.startTransaction()

    try {
      const questionOid = new Types.ObjectId(questionId)
      const adminOid = new Types.ObjectId(adminUserId)

      // 1. Create official admin answer
      const answer = new this.answerModel({
        questionId: questionOid,
        body: dto.responseBody,
        contributedBy: adminOid,
        isOfficialAdminAnswer: true,
        isAccepted: true,
      })
      const savedAnswer = await answer.save({ session })

      // 2. Push answer ref into question's answers array
      await this.connection
        .collection('questions')
        .updateOne({ _id: questionOid }, { $push: { answers: savedAnswer._id } as any, $set: { status: 'resolved', resolvedBy: adminOid } }, { session })

      // 3. Increment admin reputation by +5
      await this.connection
        .collection('users')
        .updateOne({ _id: adminOid }, { $inc: { reputation: 5 } }, { session })

      await session.commitTransaction()

      return { questionId, answerId: savedAnswer._id.toString() }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  async rebuildIndex(): Promise<{ rebuilt: boolean; count: number }> {
    try {
      const count = await this.faqEmbeddings.rebuildAll()
      await this.metaService.setLastRebuild()
      return { rebuilt: true, count }
    } catch (error) {
      this.logger.warn(`rebuildIndex failed: ${(error as Error).message}`)
      return { rebuilt: false, count: 0 }
    }
  }
}