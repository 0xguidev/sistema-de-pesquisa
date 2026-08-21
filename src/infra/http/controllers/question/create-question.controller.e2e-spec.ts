import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '@/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { AccountFactory } from 'test/factories/make-Account'
import { QuestionFactory } from 'test/factories/make-question'
import { OptionAnswerFactory } from 'test/factories/make-option-answer'
import { SessionService } from '@/infra/auth/session.service'

describe('Create Question Controller (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let sessions: SessionService
  let accountFactory: AccountFactory
  let questionFactory: QuestionFactory
  let optionAnswerFactory: OptionAnswerFactory
  let accessToken: string
  let userId: string

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory, QuestionFactory, OptionAnswerFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()

    prisma = moduleRef.get(PrismaService)
    sessions = moduleRef.get(SessionService)
    accountFactory = moduleRef.get(AccountFactory)
    questionFactory = moduleRef.get(QuestionFactory)
    optionAnswerFactory = moduleRef.get(OptionAnswerFactory)

    const user = await accountFactory.makePrismaAccount()
    userId = user.id.toString()
    accessToken = (await sessions.create(userId, {})).accessToken
  })

  afterAll(async () => {
    await app.close()
  })

  test('[POST] /questions - without conditional rules', async () => {
    const survey = await request(app.getHttpServer())
      .post('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Survey 1',
        location: 'Location 1',
        type: 'Type 1',
      })

    const response = await request(app.getHttpServer())
      .post('/questions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        questionTitle: 'Question 1',
        questionNum: 1,
        surveyId: survey.body.surveyId,
      })

    expect(response.statusCode).toBe(201)
    expect(response.body.question).toEqual(
      expect.objectContaining({
        questionTitle: 'Question 1',
        questionNum: 1,
        surveyId: survey.body.surveyId,
        accountId: userId,
      }),
    )

    const questionOnDatabase = await prisma.question.findFirst({
      where: {
        title: 'Question 1',
        surveyId: survey.body.surveyId,
      },
    })

    expect(questionOnDatabase).toBeTruthy()
  })

  test('[POST] /questions - with valid conditional rules', async () => {
    const survey = await request(app.getHttpServer())
      .post('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Survey 2',
        location: 'Location 2',
        type: 'Type 2',
      })

    const dependsOnQuestion = await questionFactory.makePrismaQuestion({
      surveyId: new UniqueEntityID(survey.body.surveyId),
      questionNum: 1,
      accountId: new UniqueEntityID(userId),
    })

    await optionAnswerFactory.makePrismaOptionAnswer({
      questionId: dependsOnQuestion.id,
      optionNum: 1,
      accountId: new UniqueEntityID(userId),
    })

    const response = await request(app.getHttpServer())
      .post('/questions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        questionTitle: 'Question 2',
        questionNum: 2,
        surveyId: survey.body.surveyId,
        conditionalRules: [
          {
            dependsOnQuestionNumber: 1,
            dependsOnOptionNumber: 1,
          },
        ],
      })

    expect(response.statusCode).toBe(201)
    expect(response.body.question.questionTitle).toBe('Question 2')

    const conditionalRuleOnDatabase = await prisma.conditionalRule.findFirst({
      where: {
        questionId: response.body.question.id,
      },
    })

    expect(conditionalRuleOnDatabase).toBeTruthy()
  })

  test('[POST] /questions - 404 when dependsOnQuestion is not found', async () => {
    const survey = await request(app.getHttpServer())
      .post('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Survey 3',
        location: 'Location 3',
        type: 'Type 3',
      })

    const response = await request(app.getHttpServer())
      .post('/questions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        questionTitle: 'Question 3',
        questionNum: 3,
        surveyId: survey.body.surveyId,
        conditionalRules: [
          {
            dependsOnQuestionNumber: 9999,
            dependsOnOptionNumber: 1,
          },
        ],
      })

    expect(response.statusCode).toBe(404)

    const questionOnDatabase = await prisma.question.findFirst({
      where: { title: 'Question 3' },
    })
    expect(questionOnDatabase).toBeNull()
  })

  test('[POST] /questions - 404 when dependsOnOption is not found', async () => {
    const survey = await request(app.getHttpServer())
      .post('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Survey 4',
        location: 'Location 4',
        type: 'Type 4',
      })

    await questionFactory.makePrismaQuestion({
      surveyId: new UniqueEntityID(survey.body.surveyId),
      questionNum: 1,
      accountId: new UniqueEntityID(userId),
    })

    const response = await request(app.getHttpServer())
      .post('/questions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        questionTitle: 'Question 4',
        questionNum: 4,
        surveyId: survey.body.surveyId,
        conditionalRules: [
          {
            dependsOnQuestionNumber: 1,
            dependsOnOptionNumber: 9999,
          },
        ],
      })

    expect(response.statusCode).toBe(404)
  })

  test('[POST] /questions - 400 with invalid payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/questions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        questionNum: 1,
        // missing questionTitle and surveyId
      })

    expect(response.statusCode).toBe(400)
  })

  test('[POST] /questions - 401 without access token', async () => {
    const response = await request(app.getHttpServer())
      .post('/questions')
      .send({
        questionTitle: 'Question 5',
        questionNum: 5,
        surveyId: 'any-survey-id',
      })

    expect(response.statusCode).toBe(401)
  })

  test('[POST] /questions - 404 for another account survey', async () => {
    const otherUser = await accountFactory.makePrismaAccount()
    const otherToken = (await sessions.create(otherUser.id.toString(), {}))
      .accessToken
    const survey = await request(app.getHttpServer())
      .post('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Private survey', location: 'X', type: 'Y' })

    const response = await request(app.getHttpServer())
      .post('/questions')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        questionTitle: 'Forbidden question',
        questionNum: 1,
        surveyId: survey.body.surveyId,
      })

    expect(response.statusCode).toBe(404)
    expect(
      await prisma.question.findFirst({
        where: { title: 'Forbidden question' },
      }),
    ).toBeNull()
  })
})
