import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'
import { OptionAnswerFactory } from '../../../../../test/factories/make-option-answer'
import { QuestionFactory } from '../../../../../test/factories/make-question'
import { SurveyFactory } from '../../../../../test/factories/make-survey'
import { SessionService } from '@/infra/auth/session.service'

describe('Fetch option by ID (E2E)', () => {
  let app: INestApplication
  let sessions: SessionService
  let accountFactory: AccountFactory
  let optionFactory: OptionAnswerFactory
  let questionFactory: QuestionFactory
  let surveyFactory: SurveyFactory

  beforeAll(async () => {
    const modularRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        AccountFactory,
        OptionAnswerFactory,
        QuestionFactory,
        SurveyFactory,
      ],
    }).compile()

    app = modularRef.createNestApplication()
    sessions = modularRef.get(SessionService)
    accountFactory = modularRef.get(AccountFactory)
    optionFactory = modularRef.get(OptionAnswerFactory)
    questionFactory = modularRef.get(QuestionFactory)
    surveyFactory = modularRef.get(SurveyFactory)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('[GET] option-answers/:id', async () => {
    const user = await accountFactory.makePrismaAccount()
    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })
    const question = await questionFactory.makePrismaQuestion({
      accountId: user.id,
      surveyId: survey.id,
    })

    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const option = await optionFactory.makePrismaOptionAnswer({
      accountId: user.id,
      questionId: question.id,
    })

    const optionId = option.id.toString()

    const response = await request(app.getHttpServer())
      .get(`/option-answers/${optionId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body.option).toEqual(
      expect.objectContaining({
        id: option.id.toString(),
        optionTitle: option.optionTitle,
        optionNum: option.optionNum,
        questionId: question.id.toString(),
        accountId: user.id.toString(),
      }),
    )
  })

  test('[GET] option-answers/:id - should return 400 for an invalid option ID', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const response = await request(app.getHttpServer())
      .get('/option-answers/invalid-id')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(400)
  })

  test('[GET] option-answers/:id - should return 404 if option does not exist', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const response = await request(app.getHttpServer())
      .get('/option-answers/00000000-0000-4000-8000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(404)
  })

  test('[GET] option-answers/:id - should return 404 if user is not the option owner', async () => {
    const owner = await accountFactory.makePrismaAccount()
    const otherUser = await accountFactory.makePrismaAccount()
    const survey = await surveyFactory.makePrismaSurvey({
      accountId: owner.id,
    })
    const question = await questionFactory.makePrismaQuestion({
      accountId: owner.id,
      surveyId: survey.id,
    })
    const option = await optionFactory.makePrismaOptionAnswer({
      accountId: owner.id,
      questionId: question.id,
    })
    const otherUserAccessToken = (
      await sessions.create(otherUser.id.toString(), {})
    ).accessToken

    const response = await request(app.getHttpServer())
      .get(`/option-answers/${option.id.toString()}`)
      .set('Authorization', `Bearer ${otherUserAccessToken}`)

    expect(response.statusCode).toBe(404)
  })
})
