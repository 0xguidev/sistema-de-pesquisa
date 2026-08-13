import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { DatabaseModule } from '@/infra/database/database.module'

describe('Edit Account (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let accountFactory: AccountFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    accountFactory = moduleRef.get(AccountFactory)

    await app.init()
  })

  test('[PUT] /accounts', async () => {
    const account = await accountFactory.makePrismaAccount({
      email: 'current-user@example.com',
      name: 'Original Name',
    })

    const accessToken = jwt.sign({ sub: account.id.toString() })

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
      where: {
        email: 'new-email@example.com',
      },
    })

    expect(accountOnDatabase).toBeTruthy()
    expect(accountOnDatabase?.name).toBe('Updated Name')
  })
})
