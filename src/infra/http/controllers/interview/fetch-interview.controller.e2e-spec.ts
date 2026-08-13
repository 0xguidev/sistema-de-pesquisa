import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '@/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { AccountFactory } from 'test/factories/make-Account'
import { InterviewFactory } from 'test/factories/make-interview'
import { SurveyFactory } from 'test/factories/make-survey'

describe('Fetch interview by ID (E2E)', () => {
  let app: INestApplication
  let jwt: JwtService
  let accountFactory: AccountFactory
  let interviewFactory: InterviewFactory
  let surveyFactory: SurveyFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory, InterviewFactory, SurveyFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    jwt = moduleRef.get(JwtService)
    accountFactory = moduleRef.get(AccountFactory)
    interviewFactory = moduleRef.get(InterviewFactory)
    surveyFactory = moduleRef.get(SurveyFactory)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('[GET] /interviews/:interviewId', async () => {
    const user = await accountFactory.makePrismaAccount()
    const survey = await surveyFactory.makePrismaSurvey({ accountId: user.id })
    const interview = await interviewFactory.makePrismaInterview({
      accountId: user.id,
      surveyId: survey.id,
    })
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .get(`/interviews/${interview.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body.interview).toEqual(
      expect.objectContaining({
        id: interview.id.toString(),
        surveyId: survey.id.toString(),
        accountId: user.id.toString(),
      }),
    )
  })

  test('[GET] /interviews/:interviewId - should return 404 if interview does not exist', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .get('/interviews/00000000-0000-4000-8000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(404)
  })

  test('[GET] /interviews/:interviewId - should return 403 if user is not the interview owner', async () => {
    const owner = await accountFactory.makePrismaAccount()
    const anotherUser = await accountFactory.makePrismaAccount()
    const survey = await surveyFactory.makePrismaSurvey({ accountId: owner.id })
    const interview = await interviewFactory.makePrismaInterview({
      accountId: owner.id,
      surveyId: survey.id,
    })
    const accessToken = jwt.sign({ sub: anotherUser.id.toString() })

    const response = await request(app.getHttpServer())
      .get(`/interviews/${interview.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(403)
  })

  test('[GET] /interviews/:interviewId - should return 400 for an invalid interview ID', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .get('/interviews/invalid-id')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(400)
  })
})
