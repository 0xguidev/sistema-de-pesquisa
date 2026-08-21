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

describe('Fetch answers by interview ID (E2E)', () => {
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

  async function createInterviewFor(accountId: string) {
    const accountIdEntity = new UniqueEntityID(accountId)
    const survey = await surveyFactory.makePrismaSurvey({
      accountId: accountIdEntity,
    })
    const interview = await interviewFactory.makePrismaInterview({
      accountId: accountIdEntity,
      surveyId: survey.id,
    })

    return { interview, survey }
  }

  async function createAnswerFor(
    interviewId: string,
    surveyId: string,
    accountId: string,
  ) {
    const accountIdEntity = new UniqueEntityID(accountId)
    const question = await questionFactory.makePrismaQuestion({
      accountId: accountIdEntity,
      surveyId: new UniqueEntityID(surveyId),
    })
    const option = await optionFactory.makePrismaOptionAnswer({
      accountId: accountIdEntity,
      questionId: question.id,
    })

    return answerFactory.makePrismaAnswerQuestion({
      accountId: accountIdEntity,
      interviewId: new UniqueEntityID(interviewId),
      questionId: question.id,
      optionAnswerId: option.id,
    })
  }

  test('[GET] /answer-questions/interview/:interviewId', async () => {
    const user = await accountFactory.makePrismaAccount()
    const { interview, survey } = await createInterviewFor(user.id.toString())
    const answer1 = await createAnswerFor(
      interview.id.toString(),
      survey.id.toString(),
      user.id.toString(),
    )
    const answer2 = await createAnswerFor(
      interview.id.toString(),
      survey.id.toString(),
      user.id.toString(),
    )
    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const response = await request(app.getHttpServer())
      .get(`/answer-questions/interview/${interview.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toHaveLength(2)
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: answer1.id.toString(),
          interviewId: interview.id.toString(),
        }),
        expect.objectContaining({
          id: answer2.id.toString(),
          interviewId: interview.id.toString(),
        }),
      ]),
    )
  })

  test('[GET] /answer-questions/interview/:interviewId - should return an empty list when interview has no answers', async () => {
    const user = await accountFactory.makePrismaAccount()
    const { interview } = await createInterviewFor(user.id.toString())
    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const response = await request(app.getHttpServer())
      .get(`/answer-questions/interview/${interview.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual([])
  })

  test('[GET] /answer-questions/interview/:interviewId - should not return answers from another user', async () => {
    const owner = await accountFactory.makePrismaAccount()
    const anotherUser = await accountFactory.makePrismaAccount()
    const { interview, survey } = await createInterviewFor(owner.id.toString())
    await createAnswerFor(
      interview.id.toString(),
      survey.id.toString(),
      owner.id.toString(),
    )
    const accessToken = (await sessions.create(anotherUser.id.toString(), {}))
      .accessToken

    const response = await request(app.getHttpServer())
      .get(`/answer-questions/interview/${interview.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual([])
  })

  test('[GET] /answer-questions/interview/:interviewId - should return 400 for an invalid interview ID', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const response = await request(app.getHttpServer())
      .get('/answer-questions/interview/invalid-id')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(400)
  })
})
