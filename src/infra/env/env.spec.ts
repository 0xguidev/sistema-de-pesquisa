import { describe, expect, it } from 'vitest'
import { ConfigService } from '@nestjs/config'
import { EnvService } from './env.service'
import { envSchema, isCorsOriginAllowed, parseCorsOrigin } from './env'

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

  it('requires CORS_ORIGIN to be present', () => {
    const parsed = envSchema.safeParse({
      DATABASE_URL: 'http://localhost:5432',
      JWT_PRIVATE_KEY: 'private-key',
      JWT_PUBLIC_KEY: 'public-key',
    })

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.error.issues.map((issue) => issue.path[0])).toContain(
        'CORS_ORIGIN',
      )
    }
  })

  it('accepts a single CORS origin', () => {
    expect(parseCorsOrigin('http://localhost:5173')).toBe(
      'http://localhost:5173',
    )
  })

  it('accepts any CORS origin when configured with a wildcard', () => {
    const configuredOrigin = parseCorsOrigin('*')

    expect(configuredOrigin).toBe('*')
    expect(
      isCorsOriginAllowed(configuredOrigin, 'https://any.example.com'),
    ).toBe(true)
  })

  it('supports multiple comma-separated CORS origins', () => {
    expect(
      parseCorsOrigin('http://localhost:5173, https://app.example.com'),
    ).toEqual(['http://localhost:5173', 'https://app.example.com'])
  })

  it('does not allow a CORS origin that is not configured', () => {
    const configuredOrigin = parseCorsOrigin('http://localhost:5173')

    expect(isCorsOriginAllowed(configuredOrigin, 'http://localhost:5173')).toBe(
      true,
    )
    expect(
      isCorsOriginAllowed(
        configuredOrigin,
        'https://not-configured.example.com',
      ),
    ).toBe(false)
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
