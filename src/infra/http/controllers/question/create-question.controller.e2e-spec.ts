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
import { OptionAnswerFactory } from 'test/factories/make-option-answer'

describe('Create question (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let accountFactory: AccountFactory
  let surveyFactory: SurveyFactory
  let questionFactory: QuestionFactory
  let optionFactory: OptionAnswerFactory

  beforeAll(async () => {
    const modularRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        AccountFactory,
        SurveyFactory,
        QuestionFactory,
        OptionAnswerFactory,
      ],
    }).compile()

    app = modularRef.createNestApplication()
    prisma = modularRef.get(PrismaService)
    jwt = modularRef.get(JwtService)
    accountFactory = modularRef.get(AccountFactory)
    surveyFactory = modularRef.get(SurveyFactory)
    questionFactory = modularRef.get(QuestionFactory)
    optionFactory = modularRef.get(OptionAnswerFactory)

    await app.init()
  })

  test('[POST] /questions', async () => {
    const user = await accountFactory.makePrismaAccount()

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })

    const response = await request(app.getHttpServer())
      .post('/questions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        questionTitle: 'New question',
        questionNum: 1,
        surveyId: survey.id.toString(),
      })

    expect(response.statusCode).toBe(201)

    const questionOnDatabase = await prisma.question.findFirst({
      where: {
        title: 'New question',
      },
    })

    expect(questionOnDatabase).toBeTruthy()
  })

  test('[POST] /questions with conditional rules', async () => {
    const user = await accountFactory.makePrismaAccount()

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })
    const fakeQuestion = await questionFactory.makePrismaQuestion({
      surveyId: survey.id,
      accountId: user.id,
    })
    const fakeOption = await optionFactory.makePrismaOptionAnswer({
      questionId: fakeQuestion.id,
      accountId: user.id,
    })

    const response = await request(app.getHttpServer())
      .post('/questions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        questionTitle: 'Question with rules',
        questionNum: 1,
        surveyId: survey.id.toString(),
        conditionalRules: [
          {
            dependsOnQuestionId: fakeQuestion.id.toString(),
            dependsOnOptionId: fakeOption.id.toString(),
            operator: 'EQUAL',
          },
        ],
      })

    expect(response.statusCode).toBe(201)

    const questionOnDatabase = await prisma.question.findFirst({
      where: {
        title: 'Question with rules',
      },
    })

    if (!questionOnDatabase) throw new Error('Question not found')

    expect(questionOnDatabase).toBeTruthy()

    const conditionalRuleOnDatabase = await prisma.conditionalRule.findFirst({
      where: {
        questionId: questionOnDatabase.id,
      },
    })

    expect(conditionalRuleOnDatabase).toBeTruthy()
  })
})
