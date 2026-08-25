import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { z } from 'zod'
import { EnvService } from '../env/env.service'
import { TokenRevocation } from '@/domain/auth/token-revocation'
import { UnauthorizedException } from '@nestjs/common'
import { SessionService } from './session.service'
import { AccountRepository } from '@/domain/repositories/account-repository'
import { AccountRole } from '@/domain/entities/account'

const JWT_ISSUER = 'sistema-de-pesquisa'
const JWT_AUDIENCE = 'sistema-de-pesquisa'

const tokenPayloadSchema = z
  .object({
    sub: z.string().uuid(),
    sid: z.string().uuid(),
    iss: z.string().min(1),
    aud: z.string().min(1),
    exp: z.number().int().positive(),
    iat: z.number().int().nonnegative(),
  })
  .refine(
    (payload) => payload.iss === JWT_ISSUER && payload.aud === JWT_AUDIENCE,
    {
      message: 'Invalid token issuer or audience',
      path: ['iss', 'aud'],
    },
  )

type TokenPayload = z.infer<typeof tokenPayloadSchema>
export type UserPayload = TokenPayload & { role: AccountRole }

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: EnvService,
    private tokenRevocation: TokenRevocation,
    private sessions: SessionService,
    private accounts: AccountRepository,
  ) {
    const publicKey = config.get('JWT_PUBLIC_KEY')

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: Buffer.from(publicKey, 'base64'),
      algorithms: ['RS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    })
  }

  async validate(payload: unknown): Promise<UserPayload> {
    const parsedPayload = tokenPayloadSchema.safeParse(payload)
    if (!parsedPayload.success) {
      throw new UnauthorizedException('Invalid token claims')
    }
    const validatedPayload = parsedPayload.data

    if (
      await this.tokenRevocation.isTokenRevoked(
        validatedPayload.sub,
        validatedPayload.iat,
        validatedPayload.sid,
      )
    ) {
      throw new UnauthorizedException('Token has been revoked')
    }

    if (
      !(await this.sessions.isActive(
        validatedPayload.sid,
        validatedPayload.sub,
      ))
    ) {
      throw new UnauthorizedException('Session is not active')
    }

    // The role is deliberately loaded from the source of truth on every request.
    // Role changes and account deletion therefore take effect immediately and do
    // not depend on access-token expiry.
    const account = await this.accounts.findById(validatedPayload.sub)
    if (!account) {
      throw new UnauthorizedException('Account is not active')
    }

    return { ...validatedPayload, role: account.role }
  }
}
