import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'
import { QuestionFactory } from 'test/factories/make-question'
import { OptionAnswerFactory } from 'test/factories/make-option-answer'
import { InterviewFactory } from 'test/factories/make-interview'
import { SurveyFactory } from 'test/factories/make-survey'

describe('Create answerquestion (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
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
        InterviewFactory,
        QuestionFactory,
        OptionAnswerFactory,
        SurveyFactory,
      ],
    }).compile()

    app = modularRef.createNestApplication()
    prisma = modularRef.get(PrismaService)
    jwt = modularRef.get(JwtService)
    accountFactory = modularRef.get(AccountFactory)
    interviewFactory = modularRef.get(InterviewFactory)
    questionFactory = modularRef.get(QuestionFactory)
    optionAnswerFactory = modularRef.get(OptionAnswerFactory)
    surveyFactory = modularRef.get(SurveyFactory)

    await app.init()
  })

  test('[POST] /answer-questions', async () => {
    const user = await accountFactory.makePrismaAccount()
    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })
    const interview = await interviewFactory.makePrismaInterview({
      accountId: user.id,
      surveyId: survey.id,
    })

    const question = await questionFactory.makePrismaQuestion({
      accountId: user.id,
      surveyId: survey.id,
    })

    const option = await optionAnswerFactory.makePrismaOptionAnswer({
      questionId: question.id,
      accountId: user.id,
    })

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .post('/answer-questions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        interviewId: interview.id.toString(),
        questionId: question.id.toString(),
        optionAnswerId: option.id.toString(),
      })

    expect(response.statusCode).toBe(201)

    const answerquestionOnDatabase = await prisma.answerQuestion.findFirst({
      where: {
        optionAnswerId: option.id.toString(),
      },
    })

    expect(answerquestionOnDatabase).toBeTruthy()
  })
})
