import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { Public } from '@/infra/auth/public'
import { AuthenticateAccountUseCase } from '@/domain/use-cases/account/authenticate-account'
import { WrongCredentialsError } from '@/domain/use-cases/error/wrong-credentials-error'
import { SkipThrottle } from '@nestjs/throttler'
import { REGISTER_IP_THROTTLER } from '@/infra/rate-limit/rate-limit.constants'
import { PublicRateLimitGuard } from '@/infra/rate-limit/public-rate-limit.guard'

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
@SkipThrottle({ [REGISTER_IP_THROTTLER]: true })
export class AuthenticateController {
  constructor(private authenticateAccount: AuthenticateAccountUseCase) {}

  @Post()
  @UsePipes(new ZodValidationPipe(authenticateBodySchema))
  async handle(@Body() body: AuthenticateBodySchema) {
    const { email, password } = body

    const result = await this.authenticateAccount.execute({
      email,
      password,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case WrongCredentialsError:
          throw new UnauthorizedException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    const { accessToken } = result.value

    return {
      access_token: accessToken,
      token_type: 'Bearer',
    }
  }
}
