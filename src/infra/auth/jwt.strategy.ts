import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { z } from 'zod'
import { EnvService } from '../env/env.service'
import { TokenRevocation } from '@/domain/auth/token-revocation'
import { UnauthorizedException } from '@nestjs/common'
import { SessionService } from './session.service'

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

export type UserPayload = z.infer<typeof tokenPayloadSchema>

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: EnvService,
    private tokenRevocation: TokenRevocation,
    private sessions: SessionService,
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

  async validate(payload: UserPayload) {
    const validatedPayload = tokenPayloadSchema.parse(payload)

    if (
      await this.tokenRevocation.isTokenRevoked(
        validatedPayload.sub,
        validatedPayload.iat,
      )
    ) {
      throw new UnauthorizedException('Token has been revoked')
    }

    if (!(await this.sessions.isActive(validatedPayload.sid, validatedPayload.sub))) {
      throw new UnauthorizedException('Session is not active')
    }

    return validatedPayload
  }
}
