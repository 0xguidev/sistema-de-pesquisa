import { AppModule } from '@/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { hash } from 'bcryptjs'
import request from 'supertest'
import { AccountFactory } from 'test/factories/make-Account'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('Authenticate (E2E)', () => {
  let app: INestApplication
  let accountFactory: AccountFactory
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    accountFactory = moduleRef.get(AccountFactory)
    prisma = moduleRef.get(PrismaService)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  function decodeJwtPart(token: string, index: 0 | 1) {
    return JSON.parse(
      Buffer.from(token.split('.')[index], 'base64url').toString('utf8'),
    ) as Record<string, unknown>
  }

  test('[POST] /sessions', async () => {
    await accountFactory.makePrismaAccount({
      email: 'johndoe@example.com',
      password: await hash('123456', 8),
    })

    const response = await request(app.getHttpServer()).post('/sessions').send({
      email: '  JOHNDOE@EXAMPLE.COM  ',
      password: '123456',
    })

    expect(response.statusCode).toBe(201)
    expect(response.body).toMatchObject({
      access_token: expect.any(String),
      refresh_token: expect.any(String),
      refresh_expires_at: expect.any(String),
      token_type: 'Bearer',
    })
    expect(response.body.access_token.split('.')).toHaveLength(3)
    expect(response.body.refresh_token.split('.')).toHaveLength(2)

    const header = decodeJwtPart(response.body.access_token, 0)
    const payload = decodeJwtPart(response.body.access_token, 1)
    expect(header.alg).toBe('RS256')
    expect(payload.sub).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
    expect(payload.exp).toEqual(expect.any(Number))
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
    expect(payload.iss).toBe('sistema-de-pesquisa')
    expect(payload.aud).toBe('sistema-de-pesquisa')

    const refreshExpiresAt = new Date(response.body.refresh_expires_at)
    expect(Number.isNaN(refreshExpiresAt.getTime())).toBe(false)
    expect(refreshExpiresAt.toISOString()).toBe(
      response.body.refresh_expires_at,
    )
    expect(refreshExpiresAt.getTime()).toBeGreaterThan(Date.now())

    expect(await prisma.session.count()).toBe(1)
    expect((await prisma.session.findFirst())?.tokenHash).not.toContain(response.body.refresh_token)
  })

  test('rejects an incorrect password with 401', async () => {
    const response = await request(app.getHttpServer()).post('/sessions').send({
      email: 'johndoe@example.com',
      password: 'incorrect-password',
    })

    expect(response.statusCode).toBe(401)
    expect(response.body.message).toBe('Credentials are not valid.')
  })

  test('rejects an unknown user with the same 401 response', async () => {
    const response = await request(app.getHttpServer()).post('/sessions').send({
      email: 'unknown-user@example.com',
      password: 'any-password',
    })

    expect(response.statusCode).toBe(401)
    expect(response.body.message).toBe('Credentials are not valid.')
  })

  test('rejects an invalid payload with 400', async () => {
    const response = await request(app.getHttpServer()).post('/sessions').send({
      email: 'not-an-email',
    })

    expect(response.statusCode).toBe(400)
    expect(response.body.message).toBe('Validation failed')
  })

  test('rate limits repeated login attempts with 429', async () => {
    const attempt = () =>
      request(app.getHttpServer()).post('/sessions').send({
        email: 'rate-limit@example.com',
        password: 'incorrect-password',
      })

    for (let index = 0; index < 5; index += 1) {
      expect((await attempt()).statusCode).toBe(401)
    }

    const response = await attempt()

    expect(response.statusCode).toBe(429)
    expect(response.headers['retry-after']).toBeDefined()
    expect(response.body.message).toBe(
      'Too many requests. Please try again later.',
    )
  })

  test('rotates refresh tokens and revokes the session on reuse', async () => {
    const login = await request(app.getHttpServer()).post('/sessions').send({
      email: 'johndoe@example.com', password: '123456',
    })
    const firstRefresh = login.body.refresh_token
    const rotated = await request(app.getHttpServer()).post('/sessions/refresh').send({
      refresh_token: firstRefresh,
    })
    expect(rotated.statusCode).toBe(201)
    expect(rotated.body.refresh_token).not.toBe(firstRefresh)

    const replay = await request(app.getHttpServer()).post('/sessions/refresh').send({
      refresh_token: firstRefresh,
    })
    expect(replay.statusCode).toBe(401)
    const afterReplay = await request(app.getHttpServer()).post('/sessions/refresh').send({
      refresh_token: rotated.body.refresh_token,
    })
    expect(afterReplay.statusCode).toBe(401)
  })

  test('logs out the current session and all account sessions', async () => {
    const login = () => request(app.getHttpServer()).post('/sessions').send({
      email: 'johndoe@example.com', password: '123456',
    })
    const first = await login()
    const second = await login()
    expect((await request(app.getHttpServer()).delete('/sessions/current')
      .auth(first.body.access_token, { type: 'bearer' })).statusCode).toBe(200)
    expect((await request(app.getHttpServer()).post('/sessions/refresh')
      .send({ refresh_token: first.body.refresh_token })).statusCode).toBe(401)
    expect((await request(app.getHttpServer()).delete('/sessions')
      .auth(second.body.access_token, { type: 'bearer' })).statusCode).toBe(200)
    expect((await request(app.getHttpServer()).post('/sessions/refresh')
      .send({ refresh_token: second.body.refresh_token })).statusCode).toBe(401)
  })
})
