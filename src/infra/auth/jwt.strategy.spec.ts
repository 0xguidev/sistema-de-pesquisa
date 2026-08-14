import { EnvService } from '../env/env.service'
import { JwtStrategy } from './jwt.strategy'
import { InMemoryTokenRevocation } from 'test/auth/in-memory-token-revocation'

type RequestLike = {
  headers: { authorization?: string }
  cookies?: { token?: string }
}

describe('JwtStrategy', () => {
  const sessionId = '223e4567-e89b-12d3-a456-426614174000'
  const tokenRevocation = new InMemoryTokenRevocation()
  const accounts = {
    findById: vi.fn().mockResolvedValue({ role: 'USER' }),
  }
  const strategy = new JwtStrategy(
    {
      get: () => Buffer.from('test-public-key').toString('base64'),
    } as unknown as EnvService,
    tokenRevocation,
    { isActive: vi.fn().mockResolvedValue(true) } as never,
    accounts as never,
  )

  const extractToken = (request: RequestLike) =>
    (
      strategy as unknown as {
        _jwtFromRequest: (request: RequestLike) => string | null
      }
    )._jwtFromRequest(request)

  it('should extract a token only from the Authorization Bearer header', () => {
    expect(
      extractToken({
        headers: { authorization: 'Bearer header-token' },
        cookies: { token: 'cookie-token' },
      }),
    ).toBe('header-token')

    expect(
      extractToken({
        headers: {},
        cookies: { token: 'cookie-token' },
      }),
    ).toBeNull()
  })

  it('should reject a token without expiration', async () => {
    const payload = {
      sub: '123e4567-e89b-12d3-a456-426614174000',
      iss: 'sistema-de-pesquisa',
      aud: 'sistema-de-pesquisa',
    } as const

    await expect(strategy.validate(payload as never)).rejects.toThrow()
  })

  it('should reject a token without issued-at', async () => {
    const payload = {
      sub: '123e4567-e89b-12d3-a456-426614174000',
      iss: 'sistema-de-pesquisa',
      aud: 'sistema-de-pesquisa',
      exp: Math.floor(Date.now() / 1000) + 60,
    }

    await expect(strategy.validate(payload as never)).rejects.toThrow()
  })

  it('should reject a revoked account token without affecting another account', async () => {
    const revokedAccountId = '123e4567-e89b-12d3-a456-426614174000'
    const activeAccountId = '123e4567-e89b-12d3-a456-426614174001'
    const payload = (sub: string) => ({
      sub,
      sid: sessionId,
      iss: 'sistema-de-pesquisa',
      aud: 'sistema-de-pesquisa',
      exp: Math.floor(Date.now() / 1000) + 60,
      iat: Math.floor(Date.now() / 1000),
    })
    const activePayload = payload(activeAccountId)

    await tokenRevocation.revokeAllForAccount(
      revokedAccountId,
      new Date((activePayload.iat + 1) * 1000),
    )

    await expect(strategy.validate(payload(revokedAccountId))).rejects.toThrow(
      'Token has been revoked',
    )
    await expect(strategy.validate(activePayload)).resolves.toEqual(
      { ...activePayload, role: 'USER' },
    )
  })

  it('accepts a token issued after revocation and compares seconds to milliseconds', async () => {
    const accountId = '123e4567-e89b-12d3-a456-426614174002'
    const revokedBefore = new Date('2026-08-14T12:00:00.500Z')
    const payload = (iat: number) => ({
      sub: accountId,
      sid: sessionId,
      iss: 'sistema-de-pesquisa',
      aud: 'sistema-de-pesquisa',
      exp: iat + 60,
      iat,
    })

    await tokenRevocation.revokeAllForAccount(accountId, revokedBefore)

    await expect(strategy.validate(payload(1786708800))).rejects.toThrow(
      'Token has been revoked',
    )
    await expect(strategy.validate(payload(1786708801))).resolves.toEqual(
      { ...payload(1786708801), role: 'USER' },
    )
  })

  it('rejects a valid session when its account no longer exists', async () => {
    accounts.findById.mockResolvedValueOnce(null as never)
    const payload = {
      sub: '123e4567-e89b-12d3-a456-426614174004',
      sid: sessionId,
      iss: 'sistema-de-pesquisa',
      aud: 'sistema-de-pesquisa',
      exp: Math.floor(Date.now() / 1000) + 60,
      iat: Math.floor(Date.now() / 1000),
    }

    await expect(strategy.validate(payload)).rejects.toThrow(
      'Account is not active',
    )
  })

  it('rejects an existing token after its account has been deleted', async () => {
    const deletedAccountId = '123e4567-e89b-12d3-a456-426614174003'
    const issuedAt = 1786708800
    const deletedAt = new Date((issuedAt + 10) * 1000)
    const deletedAccountToken = {
      sub: deletedAccountId,
      sid: sessionId,
      iss: 'sistema-de-pesquisa',
      aud: 'sistema-de-pesquisa',
      exp: issuedAt + 60,
      iat: issuedAt,
    }

    // Account deletion leaves this revocation tombstone behind.
    await tokenRevocation.revokeAllForAccount(deletedAccountId, deletedAt)

    await expect(strategy.validate(deletedAccountToken)).rejects.toThrow(
      'Token has been revoked',
    )
  })
})
