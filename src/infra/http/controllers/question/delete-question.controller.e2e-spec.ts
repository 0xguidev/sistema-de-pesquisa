import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { QuestionFactory } from 'test/factories/make-question'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'
import { SurveyFactory } from 'test/factories/make-survey'
import { OptionAnswerFactory } from 'test/factories/make-option-answer'

describe('Delete question (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let questionFactory: QuestionFactory
  let accountFactory: AccountFactory
  let surveyFactory: SurveyFactory
  let optionAnswerFactory: OptionAnswerFactory

  beforeAll(async () => {
    const modularRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        AccountFactory,
        QuestionFactory,
        SurveyFactory,
        OptionAnswerFactory,
      ],
    }).compile()

    app = modularRef.createNestApplication()
    prisma = modularRef.get(PrismaService)
    jwt = modularRef.get(JwtService)
    questionFactory = modularRef.get(QuestionFactory)
    accountFactory = modularRef.get(AccountFactory)
    surveyFactory = modularRef.get(SurveyFactory)
    optionAnswerFactory = modularRef.get(OptionAnswerFactory)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('[DELETE] /questions/:id', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })

    const question = await questionFactory.makePrismaQuestion({
      accountId: user.id,
      surveyId: survey.id,
    })

    const questionId = question.id.toString()

    const response = await request(app.getHttpServer())
      .delete(`/questions/${questionId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(204)

    const questionOnDatabase = await prisma.question.findUnique({
      where: { id: questionId },
    })

    expect(questionOnDatabase).toBeNull()
  })

  test('[DELETE] /questions/:id - also removes related conditional rules', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })

    const dependsOnQuestion = await questionFactory.makePrismaQuestion({
      accountId: user.id,
      surveyId: survey.id,
      questionNum: 1,
    })

    await optionAnswerFactory.makePrismaOptionAnswer({
      questionId: dependsOnQuestion.id,
      optionNum: 1,
      accountId: user.id,
    })

    const question = await questionFactory.makePrismaQuestion({
      accountId: user.id,
      surveyId: survey.id,
      questionNum: 2,
    })

    await prisma.conditionalRule.create({
      data: {
        questionId: question.id.toString(),
        surveyId: survey.id.toString(),
        dependsOnQuestionId: dependsOnQuestion.id.toString(),
        dependsOnQuestionNumber: 1,
        dependsOnOptionId: (
          await prisma.optionAnswer.findFirst({
            where: { questionId: dependsOnQuestion.id.toString() },
          })
        )?.id as string,
        dependsOnOptionNumber: 1,
      },
    })

    const response = await request(app.getHttpServer())
      .delete(`/questions/${question.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(204)

    const conditionalRuleOnDatabase = await prisma.conditionalRule.findFirst({
      where: { questionId: question.id.toString() },
    })

    expect(conditionalRuleOnDatabase).toBeNull()
  })

  test('[DELETE] /questions/:id - 404 if question does not exist', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .delete('/questions/non-existing-id')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(404)
  })

  test('[DELETE] /questions/:id - 403 if user is not the question owner', async () => {
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
      .delete(`/questions/${question.id.toString()}`)
      .set('Authorization', `Bearer ${otherUserAccessToken}`)

    expect(response.statusCode).toBe(403)

    const questionOnDatabase = await prisma.question.findUnique({
      where: { id: question.id.toString() },
    })

    expect(questionOnDatabase).toBeTruthy()
  })

  test('[DELETE] /questions/:id - 401 without access token', async () => {
    const response = await request(app.getHttpServer()).delete(
      '/questions/any-id',
    )

    expect(response.statusCode).toBe(401)
  })
})
