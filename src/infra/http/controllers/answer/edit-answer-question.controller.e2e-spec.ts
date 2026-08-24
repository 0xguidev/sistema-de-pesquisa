import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { SessionService } from '@/infra/auth/session.service'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'
import { AnswerQuestionFactory } from 'test/factories/make-answer-question'
import { InterviewFactory } from 'test/factories/make-interview'
import { QuestionFactory } from 'test/factories/make-question'
import { OptionAnswerFactory } from 'test/factories/make-option-answer'
import { SurveyFactory } from 'test/factories/make-survey'

describe('Edit answer question (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let sessions: SessionService
  let answerquestionFactory: AnswerQuestionFactory
  let accountFactory: AccountFactory
  let interviewFactory: InterviewFactory
  let questionFactory: QuestionFactory
  let optionAnswerFactory: OptionAnswerFactory
  let surveyFactory: SurveyFactory

  beforeAll(async () => {
    const modularRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        AccountFactory,
        AnswerQuestionFactory,
        InterviewFactory,
        QuestionFactory,
        OptionAnswerFactory,
        SurveyFactory,
      ],
    }).compile()

    app = modularRef.createNestApplication()
    prisma = modularRef.get(PrismaService)
    sessions = modularRef.get(SessionService)
    answerquestionFactory = modularRef.get(AnswerQuestionFactory)
    accountFactory = modularRef.get(AccountFactory)
    interviewFactory = modularRef.get(InterviewFactory)
    questionFactory = modularRef.get(QuestionFactory)
    optionAnswerFactory = modularRef.get(OptionAnswerFactory)
    surveyFactory = modularRef.get(SurveyFactory)

    await app.init()
  })

  test('[PUT] /answer-questions/:id', async () => {
    const account = await accountFactory.makePrismaAccount()
    const survey = await surveyFactory.makePrismaSurvey({
      accountId: account.id,
    })
    const interview = await interviewFactory.makePrismaInterview({
      accountId: account.id,
      surveyId: survey.id,
    })

    const question = await questionFactory.makePrismaQuestion({
      accountId: account.id,
      surveyId: survey.id,
    })

    const question2 = await questionFactory.makePrismaQuestion({
      accountId: account.id,
      surveyId: survey.id,
    })

    const option = await optionAnswerFactory.makePrismaOptionAnswer({
      questionId: question.id,
      accountId: account.id,
    })

    const option2 = await optionAnswerFactory.makePrismaOptionAnswer({
      questionId: question2.id,
      accountId: account.id,
    })

    const accessToken = (await sessions.create(account.id.toString(), {}))
      .accessToken

    const answerquestion = await answerquestionFactory.makePrismaAnswerQuestion(
      {
        accountId: account.id,
        interviewId: interview.id,
        questionId: question.id,
        optionAnswerId: option.id,
      },
    )

    const answerquestionId = answerquestion.id.toString()

    const response = await request(app.getHttpServer())
      .put(`/answer-questions/${answerquestionId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        questionId: question2.id.toString(),
        optionAnswerId: option2.id.toString(),
      })

    expect(response.statusCode).toBe(204)

    const answerquestionOnDatabase = await prisma.answerQuestion.findUnique({
      where: { id: answerquestionId },
    })

    expect(answerquestionOnDatabase).toMatchObject({
      id: answerquestionId,
      questionId: question2.id.toString(),
      optionAnswerId: option2.id.toString(),
    })
  })

  test('[PUT] /answer-questions/:id rejects foreign and cross-survey resources', async () => {
    const owner = await accountFactory.makePrismaAccount()
    const otherUser = await accountFactory.makePrismaAccount()
    const ownerToken = (await sessions.create(owner.id.toString(), {}))
      .accessToken
    const otherToken = (await sessions.create(otherUser.id.toString(), {}))
      .accessToken
    const survey = await surveyFactory.makePrismaSurvey({ accountId: owner.id })
    const otherSurvey = await surveyFactory.makePrismaSurvey({
      accountId: owner.id,
    })
    const interview = await interviewFactory.makePrismaInterview({
      accountId: owner.id,
      surveyId: survey.id,
    })
    const question = await questionFactory.makePrismaQuestion({
      accountId: owner.id,
      surveyId: survey.id,
    })
    const option = await optionAnswerFactory.makePrismaOptionAnswer({
      accountId: owner.id,
      questionId: question.id,
    })
    const answer = await answerquestionFactory.makePrismaAnswerQuestion({
      accountId: owner.id,
      interviewId: interview.id,
      questionId: question.id,
      optionAnswerId: option.id,
    })
    const crossSurveyQuestion = await questionFactory.makePrismaQuestion({
      accountId: owner.id,
      surveyId: otherSurvey.id,
    })
    const crossSurveyOption = await optionAnswerFactory.makePrismaOptionAnswer({
      accountId: owner.id,
      questionId: crossSurveyQuestion.id,
    })

    await request(app.getHttpServer())
      .put(`/answer-questions/${answer.id.toString()}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ optionAnswerId: option.id.toString() })
      .expect(404)

    await request(app.getHttpServer())
      .put(`/answer-questions/${answer.id.toString()}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        questionId: crossSurveyQuestion.id.toString(),
        optionAnswerId: crossSurveyOption.id.toString(),
      })
      .expect(404)
  })

  afterAll(async () => app.close())
})
