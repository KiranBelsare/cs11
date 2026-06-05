import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { CastError } from 'mongoose'

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status: number
    let message: string | object

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const res = exception.getResponse()
      message = typeof res === 'string' ? res : (res as any).message ?? res
    } else if (exception instanceof Error && (exception as any).name === 'CastError') {
      // Mongoose CastError (e.g. invalid ObjectId) → treat as 404 Not Found
      status = HttpStatus.NOT_FOUND
      message = `Resource not found: ${request.url}`
      this.logger.warn(`CastError on ${request.method} ${request.url}: ${exception.message}`)
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR
      message = 'Internal server error'
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      )
    }

    const body = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    }

    response.status(status).json(body)
  }
}