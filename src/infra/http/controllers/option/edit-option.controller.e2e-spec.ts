import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { SurveyFactory } from 'test/factories/make-survey'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'

describe('Create survey (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let surveyFactory: SurveyFactory
  let accountFactory: AccountFactory

  beforeAll(async () => {
    const modularRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory, SurveyFactory],
    }).compile()

    app = modularRef.createNestApplication()
    prisma = modularRef.get(PrismaService)
    jwt = modularRef.get(JwtService)
    surveyFactory = modularRef.get(SurveyFactory)
    accountFactory = modularRef.get(AccountFactory)

    await app.init()
  })

  test('[PUT] /surveys/:id', async () => {
    const account = await accountFactory.makePrismaAccount()

    const accessToken = jwt.sign({ sub: account.id.toString() })

    const survey = await surveyFactory.makePrismaSurvey({
      accountId: account.id,
    })

    const surveyId = survey.id.toString()

    const response = await request(app.getHttpServer())
      .put(`/surveys/${surveyId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'New title',
        location: 'New location',
      })

    expect(response.statusCode).toBe(204)

    const surveyOnDatabase = await prisma.survey.findFirst({
      where: {
        title: 'New title',
        location: 'New location',
      },
    })

    expect(surveyOnDatabase).toBeTruthy()
  })
})
