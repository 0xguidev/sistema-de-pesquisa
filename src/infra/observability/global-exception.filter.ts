import { ArgumentsHost, Catch, HttpException } from '@nestjs/common'
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core'
import type { Request } from 'express'
import { requestContext } from './request-context'
import { SecurityEvent } from './security-events'
import { SecurityLogger } from './security-logger.service'
import { SecurityMetrics } from './security-metrics.service'

type ObservedRequest = Request & {
  user?: { sub?: string }
  observabilityErrorLogged?: boolean
}

@Catch()
export class GlobalExceptionFilter extends BaseExceptionFilter {
  constructor(
    adapterHost: HttpAdapterHost,
    private readonly logger: SecurityLogger,
    private readonly metrics: SecurityMetrics,
  ) {
    super(adapterHost.httpAdapter)
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest<ObservedRequest>()
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500
    const store = requestContext.getStore()
    if (store && request.user?.sub) store.userId = request.user.sub

    if (!request.observabilityErrorLogged) {
      this.logger.operational(SecurityEvent.HTTP_ERROR, {
        status,
        error_type:
          exception instanceof Error ? exception.constructor.name : 'UnknownError',
      })
      if (status === 401 || status === 403)
        this.logger.audit(SecurityEvent.AUTHORIZATION_FAILURE, {
          status,
          reason: status === 401 ? 'authentication_required' : 'resource_denied',
        })
      this.recordStatus(status)
    }

    super.catch(exception, host)
  }

  private recordStatus(status: number) {
    if (status === 401) this.metrics.increment('http_401_total')
    if (status === 403) this.metrics.increment('http_403_total')
    if (status === 429) this.metrics.increment('http_429_total')
    if (status >= 500) this.metrics.increment('http_5xx_total')
  }
}
