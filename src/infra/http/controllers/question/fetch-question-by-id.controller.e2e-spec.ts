import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { QuestionFactory } from 'test/factories/make-question'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'
import { SurveyFactory } from 'test/factories/make-survey'

describe('Fetch question by id (E2E)', () => {
  let app: INestApplication
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
    jwt = modularRef.get(JwtService)
    questionFactory = modularRef.get(QuestionFactory)
    accountFactory = modularRef.get(AccountFactory)
    surveyFactory = modularRef.get(SurveyFactory)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('[GET] /questions/:id', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })

    const question = await questionFactory.makePrismaQuestion({
      accountId: user.id,
      surveyId: survey.id,
      questionNum: 1,
    })

    const response = await request(app.getHttpServer())
      .get(`/questions/${question.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body.question).toEqual(
      expect.objectContaining({
        id: question.id.toString(),
        surveyId: survey.id.toString(),
        accountId: user.id.toString(),
        questionNum: 1,
      }),
    )
  })

  test('[GET] /questions/:id - 404 if question does not exist', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .get('/questions/non-existing-id')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(404)
  })

  test('[GET] /questions/:id - 403 if user is not the question owner', async () => {
    const owner = await accountFactory.makePrismaAccount()
    const otherUser = await accountFactory.makePrismaAccount()
    const otherUserAccessToken = jwt.sign({ sub: otherUser.id.toString() })

    const survey = await surveyFactory.makePrismaSurvey({
      accountId: owner.id,
    })

    const question = await questionFactory.makePrismaQuestion({
      accountId: owner.id,
      surveyId: survey.id,
    })

    const response = await request(app.getHttpServer())
      .get(`/questions/${question.id.toString()}`)
      .set('Authorization', `Bearer ${otherUserAccessToken}`)

    expect(response.statusCode).toBe(403)
  })

  test('[GET] /questions/:id - 401 without access token', async () => {
    const response = await request(app.getHttpServer()).get('/questions/any-id')

    expect(response.statusCode).toBe(401)
  })
})
