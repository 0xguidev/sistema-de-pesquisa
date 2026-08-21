import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { SessionService } from '@/infra/auth/session.service'
import request from 'supertest'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { DatabaseModule } from '@/infra/database/database.module'

describe('Edit Account (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let sessions: SessionService
  let accountFactory: AccountFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    sessions = moduleRef.get(SessionService)
    accountFactory = moduleRef.get(AccountFactory)

    await app.init()
  })

  test('[PUT] /accounts', async () => {
    const account = await accountFactory.makePrismaAccount({
      email: 'current-user@example.com',
      name: 'Original Name',
    })

    const accessToken = (await sessions.create(account.id.toString(), {}))
      .accessToken

    const response = await request(app.getHttpServer())
      .put('/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Updated Name',
        email: 'new-email@example.com',
        password: 'new-password',
      })

    expect(response.statusCode).toBe(204)

    const accountOnDatabase = await prisma.user.findUnique({
      where: { id: account.id.toString() },
    })

    expect(accountOnDatabase).toMatchObject({
      id: account.id.toString(),
      email: 'new-email@example.com',
      name: 'Updated Name',
    })
  })

  test('normalizes email and rejects an email already used by another account', async () => {
    const account = await accountFactory.makePrismaAccount({
      email: 'edit-current@example.com',
    })
    await accountFactory.makePrismaAccount({
      email: 'already-used@example.com',
    })
    const accessToken = (await sessions.create(account.id.toString(), {}))
      .accessToken

    const response = await request(app.getHttpServer())
      .put('/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: '  ALREADY-USED@EXAMPLE.COM  ' })

    expect(response.statusCode).toBe(409)
  })

  test.each([
    ['an invalid password', { password: 'short' }],
    ['an empty name', { name: '   ' }],
  ])('rejects %s', async (_, body) => {
    const account = await accountFactory.makePrismaAccount()
    const accessToken = (await sessions.create(account.id.toString(), {}))
      .accessToken

    const response = await request(app.getHttpServer())
      .put('/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(body)

    expect(response.statusCode).toBe(400)
  })
})
