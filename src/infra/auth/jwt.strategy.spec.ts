import { EnvService } from '../env/env.service'
import { JwtStrategy } from './jwt.strategy'

describe('JwtStrategy', () => {
  it('should reject a token without expiration', async () => {
    const strategy = new JwtStrategy({
      get: () => Buffer.from('test-public-key').toString('base64'),
    } as unknown as EnvService)

    const payload = {
      sub: '123e4567-e89b-12d3-a456-426614174000',
      iss: 'sistema-de-pesquisa',
      aud: 'sistema-de-pesquisa',
    } as const

    await expect(strategy.validate(payload as never)).rejects.toThrow()
  })
})
