import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { DatabaseModule } from '@/infra/database/database.module'

describe('Delete Account (E2E)', () => {
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

  test('[DELETE] /accounts', async () => {
    const account = await accountFactory.makePrismaAccount({
      email: 'delete-user@example.com',
      name: 'Delete User',
    })

    const accessToken = jwt.sign({ sub: account.id.toString() })

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
  })
})
