import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { SessionService } from '@/infra/auth/session.service'
import request from 'supertest'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { DatabaseModule } from '@/infra/database/database.module'

describe('Delete Account (E2E)', () => {
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

  test('[DELETE] /accounts', async () => {
    const account = await accountFactory.makePrismaAccount({
      email: 'delete-user@example.com',
      name: 'Delete User',
    })

    const otherAccount = await accountFactory.makePrismaAccount({
      email: 'active-user@example.com',
      name: 'Active User',
    })

    const accessToken = (await sessions.create(account.id.toString(), {}))
      .accessToken
    const otherAccessToken = (
      await sessions.create(otherAccount.id.toString(), {})
    ).accessToken

    const response = await request(app.getHttpServer())
      .delete('/accounts')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(204)

    const accountOnDatabase = await prisma.user.findUnique({
      where: {
        id: account.id.toString(),
      },
    })

    expect(accountOnDatabase).toBeNull()

    await request(app.getHttpServer())
      .get('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401)

    await request(app.getHttpServer())
      .get('/surveys')
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .expect(200)
  })
})
