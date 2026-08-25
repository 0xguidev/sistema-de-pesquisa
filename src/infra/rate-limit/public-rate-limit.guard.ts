import { ExecutionContext, Inject, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
  getOptionsToken,
  ThrottlerGuard,
  ThrottlerLimitDetail,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler'
import { SecurityLogger } from '../observability/security-logger.service'
import { SecurityEvent } from '../observability/security-events'

@Injectable()
export class PublicRateLimitGuard extends ThrottlerGuard {
  constructor(
    @Inject(getOptionsToken()) options: ThrottlerModuleOptions,
    storage: ThrottlerStorage,
    reflector: Reflector,
    private readonly securityLogger: SecurityLogger,
  ) {
    super(options, storage, reflector)
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const { res } = this.getRequestResponse(context)
    res.header('Retry-After', detail.timeToBlockExpire)

    const request = context.switchToHttp().getRequest<{
      ip?: string
      body?: { email?: string }
    }>()
    this.securityLogger.audit(SecurityEvent.THROTTLED, {
      ip_id: this.securityLogger.pseudonym(request.ip),
      principal_id: this.securityLogger.pseudonym(request.body?.email),
      limit: detail.limit,
      ttl_ms: detail.ttl,
    })

    await super.throwThrottlingException(context, detail)
  }
}
