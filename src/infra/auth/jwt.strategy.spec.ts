import { EnvService } from '../env/env.service'
import { JwtStrategy } from './jwt.strategy'

type RequestLike = {
  headers: { authorization?: string }
  cookies?: { token?: string }
}

describe('JwtStrategy', () => {
  const strategy = new JwtStrategy({
    get: () => Buffer.from('test-public-key').toString('base64'),
  } as unknown as EnvService)

  const extractToken = (request: RequestLike) =>
    (strategy as unknown as { _jwtFromRequest: (request: RequestLike) => string | null })._jwtFromRequest(request)

  it('should extract a token only from the Authorization Bearer header', () => {
    expect(extractToken({
      headers: { authorization: 'Bearer header-token' },
      cookies: { token: 'cookie-token' },
    })).toBe('header-token')

    expect(extractToken({
      headers: {},
      cookies: { token: 'cookie-token' },
    })).toBeNull()
  })

  it('should reject a token without expiration', async () => {
    const payload = {
      sub: '123e4567-e89b-12d3-a456-426614174000',
      iss: 'sistema-de-pesquisa',
      aud: 'sistema-de-pesquisa',
    } as const

    await expect(strategy.validate(payload as never)).rejects.toThrow()
  })
})
