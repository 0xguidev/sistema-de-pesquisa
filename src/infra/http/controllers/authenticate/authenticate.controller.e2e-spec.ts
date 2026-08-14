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
    expect(await prisma.session.count()).toBe(1)
    expect((await prisma.session.findFirst())?.tokenHash).not.toContain(response.body.refresh_token)
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
