import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'
import { SurveyFactory } from 'test/factories/make-survey'

describe('Create interview (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let accountFactory: AccountFactory
  let surveyFactory: SurveyFactory

  beforeAll(async () => {
    const modularRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory, SurveyFactory],
    }).compile()

    app = modularRef.createNestApplication()
    prisma = modularRef.get(PrismaService)
    jwt = modularRef.get(JwtService)
    accountFactory = modularRef.get(AccountFactory)
    surveyFactory = modularRef.get(SurveyFactory)

    await app.init()
  })

  test('[POST] /interviews', async () => {
    const user = await accountFactory.makePrismaAccount()
    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .post('/interviews')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        surveyId: survey.id.toString(),
        answers: [],
      })

    expect(response.statusCode).toBe(201)

    const interviewOnDatabase = await prisma.interview.findFirst({
      where: {
        surveyId: survey.id.toString(),
      },
    })

    expect(interviewOnDatabase).toBeTruthy()
  })
})
