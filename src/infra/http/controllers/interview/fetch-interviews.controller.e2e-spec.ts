import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { InterviewFactory } from 'test/factories/make-interview'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'
import { SurveyFactory } from 'test/factories/make-survey'

describe('Fetch interviews (E2E)', () => {
  let app: INestApplication
  let jwt: JwtService
  let interviewFactory: InterviewFactory
  let accountFactory: AccountFactory
  let surveyFactory: SurveyFactory

  beforeAll(async () => {
    const modularRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory, InterviewFactory, SurveyFactory],
    }).compile()

    app = modularRef.createNestApplication()
    jwt = modularRef.get(JwtService)
    interviewFactory = modularRef.get(InterviewFactory)
    accountFactory = modularRef.get(AccountFactory)
    surveyFactory = modularRef.get(SurveyFactory)

    await app.init()
  })

  test('[GET] /interviews/:surveyId', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })

    // Cria 3 entrevistas vinculadas ao usuário e survey
    await interviewFactory.makePrismaInterview({
      accountId: user.id,
      surveyId: survey.id,
    })
    await interviewFactory.makePrismaInterview({
      accountId: user.id,
      surveyId: survey.id,
    })
    await interviewFactory.makePrismaInterview({
      accountId: user.id,
      surveyId: survey.id,
    })

    const response = await request(app.getHttpServer())
      .get(`/interviews/${survey.id.toString()}?page=1&limit=2`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual(
      expect.objectContaining({
        page: 1,
        limit: 2,
        total: 3,
        interviews: expect.any(Array),
      }),
    )
    expect(response.body.interviews).toHaveLength(2)

    // Confirma que retornou dados corretos da entrevista
    expect(response.body.interviews[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        surveyId: survey.id.toString(),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        answers: [],
      }),
    )
  })
})
