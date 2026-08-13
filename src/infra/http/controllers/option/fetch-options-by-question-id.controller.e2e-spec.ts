import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '@/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { AccountFactory } from 'test/factories/make-Account'
import { OptionAnswerFactory } from 'test/factories/make-option-answer'
import { QuestionFactory } from 'test/factories/make-question'
import { SurveyFactory } from 'test/factories/make-survey'

describe('Fetch options by question ID (E2E)', () => {
  let app: INestApplication
  let jwt: JwtService
  let accountFactory: AccountFactory
  let optionFactory: OptionAnswerFactory
  let questionFactory: QuestionFactory
  let surveyFactory: SurveyFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        AccountFactory,
        OptionAnswerFactory,
        QuestionFactory,
        SurveyFactory,
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    jwt = moduleRef.get(JwtService)
    accountFactory = moduleRef.get(AccountFactory)
    optionFactory = moduleRef.get(OptionAnswerFactory)
    questionFactory = moduleRef.get(QuestionFactory)
    surveyFactory = moduleRef.get(SurveyFactory)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('[GET] /option-answers/question/:questionId', async () => {
    const user = await accountFactory.makePrismaAccount()
    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })
    const question = await questionFactory.makePrismaQuestion({
      accountId: user.id,
      surveyId: survey.id,
    })
    const option1 = await optionFactory.makePrismaOptionAnswer({
      accountId: user.id,
      questionId: question.id,
    })
    const option2 = await optionFactory.makePrismaOptionAnswer({
      accountId: user.id,
      questionId: question.id,
    })
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .get(`/option-answers/question/${question.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: option1.id.toString(),
          questionId: question.id.toString(),
          optionTitle: option1.optionTitle,
          optionNum: option1.optionNum,
        }),
        expect.objectContaining({
          id: option2.id.toString(),
          questionId: question.id.toString(),
          optionTitle: option2.optionTitle,
          optionNum: option2.optionNum,
        }),
      ]),
    )
    expect(response.body).toHaveLength(2)
  })

  test('[GET] /option-answers/question/:questionId - should return an empty list when question has no options', async () => {
    const user = await accountFactory.makePrismaAccount()
    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })
    const question = await questionFactory.makePrismaQuestion({
      accountId: user.id,
      surveyId: survey.id,
    })
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .get(`/option-answers/question/${question.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual([])
  })

  test('[GET] /option-answers/question/:questionId - should not return options from another user', async () => {
    const owner = await accountFactory.makePrismaAccount()
    const otherUser = await accountFactory.makePrismaAccount()
    const survey = await surveyFactory.makePrismaSurvey({
      accountId: owner.id,
    })
    const question = await questionFactory.makePrismaQuestion({
      accountId: owner.id,
      surveyId: survey.id,
    })
    await optionFactory.makePrismaOptionAnswer({
      accountId: owner.id,
      questionId: question.id,
    })
    const otherUserAccessToken = jwt.sign({ sub: otherUser.id.toString() })

    const response = await request(app.getHttpServer())
      .get(`/option-answers/question/${question.id.toString()}`)
      .set('Authorization', `Bearer ${otherUserAccessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual([])
  })

  test('[GET] /option-answers/question/:questionId - should return 400 for an invalid question ID', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .get('/option-answers/question/invalid-id')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(400)
  })
})
