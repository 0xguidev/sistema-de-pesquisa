import { Injectable, NestMiddleware } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { requestContext } from './request-context'

const VALID_REQUEST_ID = /^[A-Za-z0-9._-]{1,128}$/

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
    const supplied = request.header('x-request-id')
    const requestId = supplied && VALID_REQUEST_ID.test(supplied) ? supplied : randomUUID()
    response.setHeader('x-request-id', requestId)
    requestContext.run(
      {
        requestId,
        method: request.method,
        path: request.originalUrl.split('?')[0],
      },
      next,
    )
  }
}
