import { JwtService } from '@nestjs/jwt'
import { JwtEncrypter } from './jwt-encrypter'

describe('JwtEncrypter', () => {
  it('includes iat as a NumericDate in seconds', async () => {
    const signAsync = vi.fn().mockResolvedValue('access-token')
    const encrypter = new JwtEncrypter({ signAsync } as unknown as JwtService)
    const now = new Date('2026-08-14T12:00:00.500Z')

    vi.useFakeTimers()
    vi.setSystemTime(now)

    await expect(encrypter.encrypt({ sub: 'account-id' })).resolves.toBe(
      'access-token',
    )
    expect(signAsync).toHaveBeenCalledWith({
      sub: 'account-id',
      iat: Math.floor(now.getTime() / 1000),
    })

    vi.useRealTimers()
  })
})
