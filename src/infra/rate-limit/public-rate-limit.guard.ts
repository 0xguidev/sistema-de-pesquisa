import { ExecutionContext, Injectable } from '@nestjs/common'
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler'

@Injectable()
export class PublicRateLimitGuard extends ThrottlerGuard {
  protected async throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const { res } = this.getRequestResponse(context)
    res.header('Retry-After', detail.timeToBlockExpire)

    await super.throwThrottlingException(context, detail)
  }
}
