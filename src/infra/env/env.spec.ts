import { describe, expect, it } from 'vitest'
import { ConfigService } from '@nestjs/config'
import { EnvService } from './env.service'
import { envSchema } from './env'

describe('environment validation', () => {
  it('requires JWT keys to be present', () => {
    const parsed = envSchema.safeParse({
      DATABASE_URL: 'http://localhost:5432',
      PORT: '3333',
    })

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.error.issues.map((issue) => issue.path[0])).toContain(
        'JWT_PRIVATE_KEY',
      )
      expect(parsed.error.issues.map((issue) => issue.path[0])).toContain(
        'JWT_PUBLIC_KEY',
      )
    }
  })

  it('throws a clear error when JWT keys are missing through EnvService', () => {
    const config = new ConfigService({
      DATABASE_URL: 'http://localhost:5432',
      PORT: '3333',
    })

    const envService = new EnvService(config as never)

    expect(() => envService.getOrThrow('JWT_PRIVATE_KEY')).toThrow(
      'Missing required environment variable: JWT_PRIVATE_KEY',
    )
  })
})
