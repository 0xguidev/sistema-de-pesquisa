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

const refreshSchema = z.object({ refresh_token: z.string().min(40).max(200) })

@Controller('/sessions')
export class SessionController {
  constructor(private sessions: SessionService) {}

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
    if (!tokens) throw new UnauthorizedException('Invalid refresh token')
    return this.response(tokens)
  }

  @Delete('/current')
  async logout(@CurrentUser() user: UserPayload) {
    await this.sessions.revoke(user.sid, user.sub)
    return { revoked: true }
  }

  @Delete()
  async logoutAll(@CurrentUser() user: UserPayload) {
    await this.sessions.revokeAll(user.sub)
    return { revoked: true }
  }

  response(tokens: {
    accessToken: string
    refreshToken: string
    refreshExpiresAt: Date
  }) {
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      refresh_expires_at: tokens.refreshExpiresAt.toISOString(),
      token_type: 'Bearer',
    }
  }
}
