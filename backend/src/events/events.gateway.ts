import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server } from 'socket.io'

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/' })
export class EventsGateway {
  @WebSocketServer()
  server: Server

  emitVoteUpdated(
    targetId: string,
    targetType: 'question' | 'answer' | 'faq',
    upvotes: number,
    downvotes: number,
  ) {
    this.server.emit('vote:updated', { targetId, targetType, upvotes, downvotes })
  }

  emitAnswerCreated(questionId: string, answer: unknown) {
    this.server.emit('answer:created', { questionId, answer })
  }

  emitQuestionStatusChanged(questionId: string, status: string) {
    this.server.emit('question:statusChanged', { questionId, status })
  }

  emitFaqPublished(faq: unknown) {
    this.server.emit('faq:published', { faq })
  }
}