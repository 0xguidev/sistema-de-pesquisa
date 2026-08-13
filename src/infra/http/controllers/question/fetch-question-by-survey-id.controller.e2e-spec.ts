import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { QuestionFactory } from 'test/factories/make-question'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'
import { SurveyFactory } from 'test/factories/make-survey'

describe('Fetch question by survey id (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let questionFactory: QuestionFactory
  let accountFactory: AccountFactory
  let surveyFactory: SurveyFactory

  beforeAll(async () => {
    const modularRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory, QuestionFactory, SurveyFactory],
    }).compile()

    app = modularRef.createNestApplication()
    prisma = modularRef.get(PrismaService)
    jwt = modularRef.get(JwtService)
    questionFactory = modularRef.get(QuestionFactory)
    accountFactory = modularRef.get(AccountFactory)
    surveyFactory = modularRef.get(SurveyFactory)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('[GET] /questions/:surveyId', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })

    const question1 = await questionFactory.makePrismaQuestion({
      accountId: user.id,
      surveyId: survey.id,
      questionNum: 1,
    })
    const question2 = await questionFactory.makePrismaQuestion({
      accountId: user.id,
      surveyId: survey.id,
      questionNum: 2,
    })
    const question3 = await questionFactory.makePrismaQuestion({
      accountId: user.id,
      surveyId: survey.id,
      questionNum: 3,
    })

    const response = await request(app.getHttpServer())
      .get(`/questions/survey/${survey.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual(
      expect.objectContaining([
        {
          id: question1.id.toString(),
          questionTitle: question1.questionTitle,
          questionNum: question1.questionNum,
          surveyId: question1.surveyId.toString(),
          accountId: question1.accountId.toString(),
        },
        {
          id: question2.id.toString(),
          questionTitle: question2.questionTitle,
          questionNum: question2.questionNum,
          surveyId: question2.surveyId.toString(),
          accountId: question2.accountId.toString(),
        },
        {
          id: question3.id.toString(),
          questionTitle: question3.questionTitle,
          questionNum: question3.questionNum,
          surveyId: question3.surveyId.toString(),
          accountId: question3.accountId.toString(),
        },
      ]),
    )
  })

  test('[GET] /questions/:surveyId - 404 if question does not exist', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .get('/questions/non-existing-id')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(404)
  })

  test('[GET] /questions/:id - 401 without access token', async () => {
    const response = await request(app.getHttpServer()).get(
      '/questions/survey/any-id',
    )

    expect(response.statusCode).toBe(401)
  })
})
