import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  Headers,
  Ip,
} from '@nestjs/common'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { Public } from '@/infra/auth/public'
import { AuthenticateAccountUseCase } from '@/domain/use-cases/account/authenticate-account'
import { WrongCredentialsError } from '@/domain/use-cases/error/wrong-credentials-error'
import { SkipThrottle } from '@nestjs/throttler'
import {
  REFRESH_IP_THROTTLER,
  REFRESH_SESSION_THROTTLER,
  REGISTER_IP_THROTTLER,
} from '@/infra/rate-limit/rate-limit.constants'
import { PublicRateLimitGuard } from '@/infra/rate-limit/public-rate-limit.guard'
import { SessionService } from '@/infra/auth/session.service'
import { SecurityLogger } from '@/infra/observability/security-logger.service'
import { SecurityMetrics } from '@/infra/observability/security-metrics.service'
import { SecurityEvent } from '@/infra/observability/security-events'

const authenticateBodySchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string(),
})

type AuthenticateBodySchema = z.infer<typeof authenticateBodySchema>

@Controller('/sessions')
@Public()
@UseGuards(PublicRateLimitGuard)
@SkipThrottle({
  [REGISTER_IP_THROTTLER]: true,
  [REFRESH_IP_THROTTLER]: true,
  [REFRESH_SESSION_THROTTLER]: true,
})
export class AuthenticateController {
  constructor(
    private authenticateAccount: AuthenticateAccountUseCase,
    private sessions: SessionService,
    private securityLogger: SecurityLogger,
    private metrics: SecurityMetrics,
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(authenticateBodySchema))
  async handle(
    @Body() body: AuthenticateBodySchema,
    @Headers('user-agent') userAgent?: string,
    @Ip() ip?: string,
  ) {
    const { email, password } = body

    const result = await this.authenticateAccount.execute({
      email,
      password,
    })

    if (result.isLeft()) {
      const error = result.value

      this.securityLogger.audit(SecurityEvent.LOGIN_FAILURE, {
        principal_id: this.securityLogger.pseudonym(email),
        ip_id: this.securityLogger.pseudonym(ip),
        reason: error.constructor.name,
      })
      this.metrics.increment('login_failures_total')

      switch (error.constructor) {
        case WrongCredentialsError:
          throw new UnauthorizedException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    const tokens = await this.sessions.create(result.value.accountId, {
      userAgent,
      ip,
    })

    this.securityLogger.audit(SecurityEvent.LOGIN_SUCCESS, {
      principal_id: this.securityLogger.pseudonym(result.value.accountId),
      ip_id: this.securityLogger.pseudonym(ip),
    })

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      refresh_expires_at: tokens.refreshExpiresAt.toISOString(),
      token_type: 'Bearer',
    }
  }
}
