import { describe, expect, it } from 'vitest'
import { ConfigService } from '@nestjs/config'
import { EnvService } from './env.service'
import { envSchema, isCorsOriginAllowed, parseCorsOrigin } from './env'

describe('environment validation', () => {
  const requiredEnvironment = {
    DATABASE_URL: 'http://localhost:5432',
    JWT_PRIVATE_KEY: 'private-key',
    JWT_PUBLIC_KEY: 'public-key',
    CORS_ORIGIN: 'http://localhost:5173',
  }

  it('uses bcrypt cost 10 by default and reads a configured cost', () => {
    expect(envSchema.parse(requiredEnvironment).BCRYPT_COST).toBe(10)
    expect(
      envSchema.parse({ ...requiredEnvironment, BCRYPT_COST: '12' })
        .BCRYPT_COST,
    ).toBe(12)
  })

  it('reads rate limits and trusted proxy hops from the environment', () => {
    const parsed = envSchema.parse({
      ...requiredEnvironment,
      TRUST_PROXY_HOPS: '1',
      LOGIN_RATE_LIMIT_IP_MAX: '10',
      LOGIN_RATE_LIMIT_IDENTIFIER_MAX: '4',
      LOGIN_RATE_LIMIT_WINDOW_SECONDS: '60',
      REGISTER_RATE_LIMIT_IP_MAX: '3',
      REGISTER_RATE_LIMIT_WINDOW_SECONDS: '120',
    })

    expect(parsed).toMatchObject({
      TRUST_PROXY_HOPS: 1,
      LOGIN_RATE_LIMIT_IP_MAX: 10,
      LOGIN_RATE_LIMIT_IDENTIFIER_MAX: 4,
      LOGIN_RATE_LIMIT_WINDOW_SECONDS: 60,
      REGISTER_RATE_LIMIT_IP_MAX: 3,
      REGISTER_RATE_LIMIT_WINDOW_SECONDS: 120,
    })
  })

  it('rejects unsafe proxy and rate-limit configuration', () => {
    expect(
      envSchema.safeParse({ ...requiredEnvironment, TRUST_PROXY_HOPS: '-1' })
        .success,
    ).toBe(false)
    expect(
      envSchema.safeParse({
        ...requiredEnvironment,
        LOGIN_RATE_LIMIT_IP_MAX: '0',
      }).success,
    ).toBe(false)
  })

  it('validates configurable report resource limits', () => {
    const parsed = envSchema.parse({
      ...requiredEnvironment,
      REPORT_RATE_LIMIT_USER_MAX: '4',
      REPORT_PDF_GLOBAL_CONCURRENCY: '3',
      REPORT_PDF_USER_CONCURRENCY: '1',
      REPORT_TIMEOUT_MS: '15000',
      REPORT_MAX_INTERVIEWS: '500',
      REPORT_MAX_QUESTIONS: '40',
      REPORT_MAX_OPTIONS_PER_QUESTION: '20',
      REPORT_MAX_TEXT_LENGTH: '2000',
      REPORT_MAX_DOCUMENT_BYTES: '5242880',
    })

    expect(parsed).toMatchObject({
      REPORT_RATE_LIMIT_USER_MAX: 4,
      REPORT_PDF_GLOBAL_CONCURRENCY: 3,
      REPORT_PDF_USER_CONCURRENCY: 1,
      REPORT_TIMEOUT_MS: 15000,
      REPORT_MAX_INTERVIEWS: 500,
      REPORT_MAX_DOCUMENT_BYTES: 5242880,
    })
    expect(
      envSchema.safeParse({
        ...requiredEnvironment,
        REPORT_PDF_GLOBAL_CONCURRENCY: '1',
        REPORT_PDF_USER_CONCURRENCY: '2',
      }).success,
    ).toBe(false)
  })

  it.each(['9', '15', '10.5', 'invalid'])(
    'rejects invalid bcrypt cost %s',
    (bcryptCost) => {
      expect(
        envSchema.safeParse({
          ...requiredEnvironment,
          BCRYPT_COST: bcryptCost,
        }).success,
      ).toBe(false)
    },
  )

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
