import {
  Body,
  Controller,
  Delete,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { z } from 'zod'
import { Public } from '@/infra/auth/public'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { SessionService } from '@/infra/auth/session.service'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { PublicRateLimitGuard } from '@/infra/rate-limit/public-rate-limit.guard'
import { SkipThrottle } from '@nestjs/throttler'
import {
  LOGIN_IDENTIFIER_THROTTLER,
  LOGIN_IP_THROTTLER,
  REGISTER_IP_THROTTLER,
  REPORT_USER_THROTTLER,
} from '@/infra/rate-limit/rate-limit.constants'
import { SecurityLogger } from '@/infra/observability/security-logger.service'
import { SecurityEvent } from '@/infra/observability/security-events'

const refreshSchema = z.object({ refresh_token: z.string().min(40).max(200) })

@Controller('/sessions')
export class SessionController {
  constructor(
    private sessions: SessionService,
    private securityLogger: SecurityLogger,
  ) {}

  @Public()
  @Post('/refresh')
  @UseGuards(PublicRateLimitGuard)
  @SkipThrottle({
    [LOGIN_IP_THROTTLER]: true,
    [LOGIN_IDENTIFIER_THROTTLER]: true,
    [REGISTER_IP_THROTTLER]: true,
    [REPORT_USER_THROTTLER]: true,
  })
  async refresh(
    @Body(new ZodValidationPipe(refreshSchema))
    body: z.infer<typeof refreshSchema>,
  ) {
    const tokens = await this.sessions.rotate(body.refresh_token)
    if (!tokens) {
      this.securityLogger.audit(SecurityEvent.REFRESH_FAILURE, {
        reason: 'invalid_or_expired',
      })
      throw new UnauthorizedException('Invalid refresh token')
    }
    this.securityLogger.audit(SecurityEvent.REFRESH_SUCCESS, {
      principal_id: this.securityLogger.pseudonym(tokens.accountId),
    })
    return this.response(tokens)
  }

  @Delete('/current')
  async logout(@CurrentUser() user: UserPayload) {
    await this.sessions.revoke(user.sid, user.sub)
    this.securityLogger.audit(SecurityEvent.LOGOUT, {
      session_id: this.securityLogger.pseudonym(user.sid),
    })
    return { revoked: true }
  }

  @Delete()
  async logoutAll(@CurrentUser() user: UserPayload) {
    await this.sessions.revokeAll(user.sub)
    this.securityLogger.audit(SecurityEvent.SESSIONS_REVOKED, {
      scope: 'all',
    })
    return { revoked: true }
  }

  response(tokens: {
    accessToken: string
    refreshToken: string
    refreshExpiresAt: Date
    accountId?: string
  }) {
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      refresh_expires_at: tokens.refreshExpiresAt.toISOString(),
      token_type: 'Bearer',
    }
  }
}
