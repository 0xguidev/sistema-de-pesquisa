import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'

describe('Create survey (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let accountFactory: AccountFactory

  beforeAll(async () => {
    const modularRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory],
    }).compile()

    app = modularRef.createNestApplication()
    prisma = modularRef.get(PrismaService)
    jwt = modularRef.get(JwtService)
    accountFactory = modularRef.get(AccountFactory)

    await app.init()
  })

  test('[POST] /questions', async () => {
    const user = await accountFactory.makePrismaAccount()

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .post('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'New survey',
        location: 'survey location',
        type: 'survey',
      })

    expect(response.statusCode).toBe(201)

    const surveyOnDatabase = await prisma.survey.findFirst({
      where: {
        title: 'New survey',
      },
    })

    expect(surveyOnDatabase).toBeTruthy()
  })
})
