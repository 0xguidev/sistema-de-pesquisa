import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import type { Request, Response } from 'express'
import { catchError, tap, throwError } from 'rxjs'
import { requestContext } from './request-context'
import { SecurityEvent } from './security-events'
import { SecurityLogger } from './security-logger.service'
import { SecurityMetrics } from './security-metrics.service'

@Injectable()
export class HttpObservabilityInterceptor implements NestInterceptor {
  constructor(private logger: SecurityLogger, private metrics: SecurityMetrics) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<
      Request & {
        user?: { sub?: string }
        observabilityErrorLogged?: boolean
      }
    >()
    const response = context.switchToHttp().getResponse<Response>()
    const store = requestContext.getStore()
    if (store && request.user?.sub) store.userId = request.user.sub
    const started = Date.now()

    if (this.path(request).startsWith('/reports')) {
      this.logger.audit(SecurityEvent.REPORT_STARTED, this.resource(request))
      this.metrics.increment('report_generation_total')
    }

    return next.handle().pipe(
      tap((result: unknown) => {
        this.recordStatus(response.statusCode)
        this.logger.operational(SecurityEvent.HTTP_COMPLETED, {
          status: response.statusCode,
          duration_ms: Date.now() - started,
        })
        this.successAudit(request, result)
      }),
      catchError((error: unknown) => {
        request.observabilityErrorLogged = true
        const status = this.statusOf(error)
        this.recordStatus(status)
        this.logger.operational(SecurityEvent.HTTP_ERROR, {
          status,
          duration_ms: Date.now() - started,
          error_type: error instanceof Error ? error.constructor.name : 'UnknownError',
        })
        if (status === 401 || status === 403)
          this.logger.audit(SecurityEvent.AUTHORIZATION_FAILURE, {
            status,
            reason: status === 401 ? 'authentication_required' : 'resource_denied',
            resource_id: this.logger.pseudonym(
              this.param(request.params?.id ?? request.params?.surveyId),
            ),
          })
        if (this.path(request).startsWith('/reports'))
          this.logger.audit(SecurityEvent.REPORT_FAILURE, { ...this.resource(request), status })
        return throwError(() => error)
      }),
    )
  }

  private successAudit(request: Request, result: unknown) {
    const path = this.path(request)
    const key = `${request.method} ${path}`
    const events: Record<string, (typeof SecurityEvent)[keyof typeof SecurityEvent]> = {
      'PUT /accounts': SecurityEvent.ACCOUNT_UPDATED,
      'DELETE /accounts': SecurityEvent.ACCOUNT_DELETED,
      'POST /surveys': SecurityEvent.SURVEY_CREATED,
    }
    let event = events[key]
    if (path.startsWith('/surveys/')) {
      if (request.method === 'PUT') event = SecurityEvent.SURVEY_UPDATED
      if (request.method === 'DELETE') event = SecurityEvent.SURVEY_DELETED
    }
    if (path.startsWith('/reports')) event = SecurityEvent.REPORT_SUCCESS
    if (event) {
      const responseResource =
        result && typeof result === 'object' && 'surveyId' in result
          ? String((result as { surveyId: unknown }).surveyId)
          : undefined
      this.logger.audit(event, {
        ...this.resource(request),
        resource_id:
          this.logger.pseudonym(responseResource) ??
          this.resource(request).resource_id,
      })
    }
  }

  private resource(request: Request) {
    return {
      resource_id: this.logger.pseudonym(
        this.param(request.params?.id ?? request.params?.surveyId),
      ),
    }
  }

  private param(value?: string | string[]) {
    return Array.isArray(value) ? value[0] : value
  }

  private path(request: Request) {
    return requestContext.getStore()?.path ?? request.path
  }

  private statusOf(error: unknown): number {
    const candidate = error as { getStatus?: () => number; status?: number }
    return candidate?.getStatus?.() ?? candidate?.status ?? 500
  }

  private recordStatus(status: number) {
    if (status === 401) this.metrics.increment('http_401_total')
    if (status === 403) this.metrics.increment('http_403_total')
    if (status === 429) this.metrics.increment('http_429_total')
    if (status >= 500) this.metrics.increment('http_5xx_total')
  }
}
