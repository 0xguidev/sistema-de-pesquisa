import { INestApplication } from '@nestjs/common'
import { SessionService } from '@/infra/auth/session.service'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { AppModule } from '@/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { AccountFactory } from 'test/factories/make-Account'
import { AnswerQuestionFactory } from 'test/factories/make-answer-question'
import { InterviewFactory } from 'test/factories/make-interview'
import { OptionAnswerFactory } from 'test/factories/make-option-answer'
import { QuestionFactory } from 'test/factories/make-question'
import { SurveyFactory } from 'test/factories/make-survey'

describe('Fetch answer by ID (E2E)', () => {
  let app: INestApplication
  let sessions: SessionService
  let accountFactory: AccountFactory
  let answerFactory: AnswerQuestionFactory
  let interviewFactory: InterviewFactory
  let optionFactory: OptionAnswerFactory
  let questionFactory: QuestionFactory
  let surveyFactory: SurveyFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        AccountFactory,
        AnswerQuestionFactory,
        InterviewFactory,
        OptionAnswerFactory,
        QuestionFactory,
        SurveyFactory,
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    sessions = moduleRef.get(SessionService)
    accountFactory = moduleRef.get(AccountFactory)
    answerFactory = moduleRef.get(AnswerQuestionFactory)
    interviewFactory = moduleRef.get(InterviewFactory)
    optionFactory = moduleRef.get(OptionAnswerFactory)
    questionFactory = moduleRef.get(QuestionFactory)
    surveyFactory = moduleRef.get(SurveyFactory)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  async function createAnswerFor(accountId: string) {
    const accountIdEntity = new UniqueEntityID(accountId)
    const survey = await surveyFactory.makePrismaSurvey({
      accountId: accountIdEntity,
    })
    const interview = await interviewFactory.makePrismaInterview({
      accountId: accountIdEntity,
      surveyId: survey.id,
    })
    const question = await questionFactory.makePrismaQuestion({
      accountId: accountIdEntity,
      surveyId: survey.id,
    })
    const option = await optionFactory.makePrismaOptionAnswer({
      accountId: accountIdEntity,
      questionId: question.id,
    })
    const answer = await answerFactory.makePrismaAnswerQuestion({
      accountId: interview.accountId,
      interviewId: interview.id,
      questionId: question.id,
      optionAnswerId: option.id,
    })

    return { answer, interview, option, question }
  }

  test('[GET] /answer-questions/:answerId', async () => {
    const user = await accountFactory.makePrismaAccount()
    const { answer, interview, option, question } = await createAnswerFor(
      user.id.toString(),
    )
    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const response = await request(app.getHttpServer())
      .get(`/answer-questions/${answer.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body.answer).toEqual(
      expect.objectContaining({
        id: answer.id.toString(),
        interviewId: interview.id.toString(),
        questionId: question.id.toString(),
        optionAnswerId: option.id.toString(),
        accountId: user.id.toString(),
      }),
    )
  })

  test('[GET] /answer-questions/:answerId - should return 404 if answer does not exist', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const response = await request(app.getHttpServer())
      .get('/answer-questions/00000000-0000-4000-8000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(404)
  })

  test('[GET] /answer-questions/:answerId - should return 403 if user is not the answer owner', async () => {
    const owner = await accountFactory.makePrismaAccount()
    const anotherUser = await accountFactory.makePrismaAccount()
    const { answer } = await createAnswerFor(owner.id.toString())
    const accessToken = (await sessions.create(anotherUser.id.toString(), {}))
      .accessToken

    const response = await request(app.getHttpServer())
      .get(`/answer-questions/${answer.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(403)
  })

  test('[GET] /answer-questions/:answerId - should return 400 for an invalid answer ID', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const response = await request(app.getHttpServer())
      .get('/answer-questions/invalid-id')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(400)
  })
})
