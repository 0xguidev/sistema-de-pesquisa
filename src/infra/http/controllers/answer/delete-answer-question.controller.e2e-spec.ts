import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'
import { SurveyFactory } from 'test/factories/make-survey'
import { QuestionFactory } from 'test/factories/make-question'
import { AnswerQuestionFactory } from 'test/factories/make-answer-question'
import { OptionAnswerFactory } from 'test/factories/make-option-answer'
import { InterviewFactory } from 'test/factories/make-interview'

describe('Delete answerquestion (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let answerquestionFactory: AnswerQuestionFactory
  let accountFactory: AccountFactory
  let surveyFactory: SurveyFactory
  let questionFactory: QuestionFactory
  let optionanswerFactory: OptionAnswerFactory
  let interviewFactory: InterviewFactory

  beforeAll(async () => {
    const modularRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        AccountFactory,
        AnswerQuestionFactory,
        SurveyFactory,
        QuestionFactory,
        OptionAnswerFactory,
        InterviewFactory,
      ],
    }).compile()

    app = modularRef.createNestApplication()
    prisma = modularRef.get(PrismaService)
    jwt = modularRef.get(JwtService)
    answerquestionFactory = modularRef.get(AnswerQuestionFactory)
    accountFactory = modularRef.get(AccountFactory)
    surveyFactory = modularRef.get(SurveyFactory)
    questionFactory = modularRef.get(QuestionFactory)
    optionanswerFactory = modularRef.get(OptionAnswerFactory)
    interviewFactory = modularRef.get(InterviewFactory)

    await app.init()
  })

  test('[DELETE] /answer-questions/:id', async () => {
    const user = await accountFactory.makePrismaAccount()

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })

    const question = await questionFactory.makePrismaQuestion({
      accountId: user.id,
      surveyId: survey.id,
    })

    const optionanswer = await optionanswerFactory.makePrismaOptionAnswer({
      accountId: user.id,
      questionId: question.id,
    })

    const interview = await interviewFactory.makePrismaInterview({
      accountId: user.id,
      surveyId: survey.id,
    })

    const answerquestion = await answerquestionFactory.makePrismaAnswerQuestion(
      {
        accountId: user.id,
        questionId: question.id,
        optionAnswerId: optionanswer.id,
        interviewId: interview.id,
      },
    )

    const answerQuestionId = answerquestion.id.toString()

    const isAnswerQuestionExists = await prisma.answerQuestion.findUnique({
      where: {
        id: answerQuestionId,
      },
    })

    expect(isAnswerQuestionExists).toBeTruthy()

    const response = await request(app.getHttpServer())
      .delete(`/answer-questions/${answerQuestionId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(204)

    const answerQuestionOnDatabase = await prisma.answerQuestion.findUnique({
      where: {
        id: answerQuestionId,
      },
    })

    expect(answerQuestionOnDatabase).toBeNull()
  })
})
