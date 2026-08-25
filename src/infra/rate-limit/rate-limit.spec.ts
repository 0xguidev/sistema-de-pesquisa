import { left, right } from '@/core/types/either'
import { AuthenticateAccountUseCase } from '@/domain/use-cases/account/authenticate-account'
import { RegisterAccountUseCase } from '@/domain/use-cases/account/create-account'
import { WrongCredentialsError } from '@/domain/use-cases/error/wrong-credentials-error'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { ThrottlerModule } from '@nestjs/throttler'
import request from 'supertest'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { EnvService } from '../env/env.service'
import { AuthenticateController } from '../http/controllers/authenticate/authenticate.controller'
import { CreateAccountController } from '../http/controllers/account/create-account.controller'
import { SessionController } from '../http/controllers/authenticate/session.controller'
import {
  createRateLimitOptions,
  loginIdentifierTracker,
  refreshSessionTracker,
} from './rate-limit.config'
import { RATE_LIMIT_MESSAGE } from './rate-limit.constants'
import { PublicRateLimitGuard } from './public-rate-limit.guard'
import { SessionService } from '../auth/session.service'
import { ControllableThrottlerStorage } from 'test/rate-limit/controllable-throttler-storage'

describe('public endpoint rate limiting', () => {
  let app: INestApplication
  const throttlerStorage = new ControllableThrottlerStorage()
  const authenticate = vi.fn()
  const register = vi.fn()

  beforeAll(async () => {
    const values = {
      LOGIN_RATE_LIMIT_IP_MAX: 2,
      LOGIN_RATE_LIMIT_IDENTIFIER_MAX: 2,
      LOGIN_RATE_LIMIT_WINDOW_SECONDS: 1,
      REGISTER_RATE_LIMIT_IP_MAX: 1,
      REGISTER_RATE_LIMIT_WINDOW_SECONDS: 1,
      REFRESH_RATE_LIMIT_IP_MAX: 10,
      REFRESH_RATE_LIMIT_SESSION_MAX: 1,
      REFRESH_RATE_LIMIT_WINDOW_SECONDS: 1,
      REPORT_RATE_LIMIT_USER_MAX: 10,
      REPORT_RATE_LIMIT_WINDOW_SECONDS: 1,
    }
    const env = {
      get: (key: keyof typeof values) => values[key],
    } as EnvService

    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          ...createRateLimitOptions(env),
          storage: throttlerStorage,
        }),
      ],
      controllers: [
        AuthenticateController,
        CreateAccountController,
        SessionController,
      ],
      providers: [
        PublicRateLimitGuard,
        {
          provide: SessionService,
          useValue: {
            create: vi.fn(),
            rotate: vi.fn().mockResolvedValue(null),
          },
        },
        {
          provide: AuthenticateAccountUseCase,
          useValue: { execute: authenticate },
        },
        {
          provide: RegisterAccountUseCase,
          useValue: { execute: register },
        },
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  beforeEach(() => {
    throttlerStorage.reset()
    authenticate.mockReset()
    register.mockReset()
    authenticate.mockResolvedValue(left(new WrongCredentialsError()))
    register.mockResolvedValue(right({ account: null as never }))
  })

  afterAll(async () => {
    await app.close()
  })

  function attempt(email = 'user@example.com', forwardedFor?: string) {
    const pendingRequest = request(app.getHttpServer())
      .post('/sessions')
      .send({ email, password: 'not-the-password' })

    return forwardedFor
      ? pendingRequest.set('X-Forwarded-For', forwardedFor)
      : pendingRequest
  }

  it('allows requests within the configured limit', async () => {
    await attempt(' USER@example.com ').expect(401)
    await attempt('user@example.com').expect(401)

    expect(authenticate).toHaveBeenCalledTimes(2)
    expect(authenticate).toHaveBeenLastCalledWith({
      email: 'user@example.com',
      password: 'not-the-password',
    })
  })

  it('returns a consistent 429 response after the limit is exceeded', async () => {
    await attempt().expect(401)
    await attempt().expect(401)
    const response = await attempt().expect(429)

    expect(response.body).toEqual({
      statusCode: 429,
      message: RATE_LIMIT_MESSAGE,
    })
    expect(response.headers['retry-after']).toBeDefined()
    expect(authenticate).toHaveBeenCalledTimes(2)
  })

  it('recovers after the configured window', async () => {
    await attempt().expect(401)
    await attempt().expect(401)
    await attempt().expect(429)

    throttlerStorage.advanceBy(1_100)

    await attempt().expect(401)
  })

  it('ignores client-supplied forwarding headers when no proxy is trusted', async () => {
    await attempt('first@example.com', '198.51.100.1').expect(401)
    await attempt('second@example.com', '198.51.100.2').expect(401)
    await attempt('third@example.com', '198.51.100.3').expect(429)

    expect(authenticate).toHaveBeenCalledTimes(2)
  })

  it('returns the same generic error for every invalid identifier', async () => {
    const first = await attempt('existing@example.com').expect(401)
    const second = await attempt('unknown@example.com').expect(401)

    expect(first.body.message).toBe('Credentials are not valid.')
    expect(second.body).toEqual(first.body)
  })

  it('applies the separate registration limit', async () => {
    const body = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'valid-password',
    }

    await request(app.getHttpServer()).post('/accounts').send(body).expect(201)
    const response = await request(app.getHttpServer())
      .post('/accounts')
      .send({ ...body, email: 'other@example.com' })
      .expect(429)

    expect(response.body.message).toBe(RATE_LIMIT_MESSAGE)
    expect(register).toHaveBeenCalledTimes(1)
  })

  it('hashes the normalized identifier without including email or password', () => {
    const tracker = loginIdentifierTracker({
      ip: '127.0.0.1',
      body: { email: ' USER@example.com ' },
    })

    expect(tracker).toBe(
      loginIdentifierTracker({
        ip: '127.0.0.1',
        body: { email: 'user@example.com' },
      }),
    )
    expect(tracker).not.toContain('user@example.com')
    expect(tracker).not.toContain('password')
  })

  it('throttles refresh independently by a hashed valid session id', async () => {
    const sessionId = '223e4567-e89b-42d3-a456-426614174000'
    const refreshToken = `${sessionId}.secret-that-is-never-part-of-the-key-or-error`

    await request(app.getHttpServer())
      .post('/sessions/refresh')
      .send({ refresh_token: refreshToken })
      .expect(401)
    const response = await request(app.getHttpServer())
      .post('/sessions/refresh')
      .send({ refresh_token: refreshToken })
      .expect(429)

    const tracker = refreshSessionTracker({
      body: { refresh_token: refreshToken },
    })
    expect(tracker).toMatch(/^[a-f0-9]{64}$/)
    expect(tracker).not.toContain(sessionId)
    expect(JSON.stringify(response.body)).not.toContain(refreshToken)
  })

  it('shares counters between replica instances using the same store', async () => {
    const [replicaA, replicaB] =
      ControllableThrottlerStorage.sharedReplicas(2)

    const first = await replicaA.increment(
      'same-client',
      1_000,
      1,
      1_000,
      'refresh',
    )
    const second = await replicaB.increment(
      'same-client',
      1_000,
      1,
      1_000,
      'refresh',
    )

    expect(first.isBlocked).toBe(false)
    expect(second.isBlocked).toBe(true)
  })
})
