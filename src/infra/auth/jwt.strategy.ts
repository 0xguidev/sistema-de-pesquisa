import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { z } from 'zod'
import { EnvService } from '../env/env.service'

const JWT_ISSUER = 'sistema-de-pesquisa'
const JWT_AUDIENCE = 'sistema-de-pesquisa'

const tokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  iss: z.string().min(1),
  aud: z.string().min(1),
  exp: z.number().int().positive(),
}).refine((payload) => payload.iss === JWT_ISSUER && payload.aud === JWT_AUDIENCE, {
  message: 'Invalid token issuer or audience',
  path: ['iss', 'aud'],
})

export type UserPayload = z.infer<typeof tokenPayloadSchema>

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: EnvService) {
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
    return tokenPayloadSchema.parse(payload)
  }
}
