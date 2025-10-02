import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { AppModule } from '@/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { AccountFactory } from 'test/factories/make-Account'
import { QuestionFactory } from 'test/factories/make-question'
import { OptionAnswerFactory } from 'test/factories/make-option-answer'

describe('Create Question Controller (E2E)', () => {
  let app: INestApplication
  let jwt: JwtService
  let accountFactory: AccountFactory
  let questionFactory: QuestionFactory
  let optionAnswerFactory: OptionAnswerFactory
  let accessToken: string
  let userId: string

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()

    jwt = moduleRef.get(JwtService)
    const prisma = moduleRef.get(PrismaService)
    accountFactory = new AccountFactory(prisma)
    questionFactory = new QuestionFactory(prisma)
    optionAnswerFactory = new OptionAnswerFactory(prisma)

    // Create a user and generate token
    const user = await accountFactory.makePrismaAccount()
    userId = user.id.toString()
    accessToken = jwt.sign({ sub: userId })
  })

  afterAll(async () => {
    await app.close()
  })

  it('should create a question without conditional rules', async () => {
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
        surveyId: survey.body.survey.id,
      })

    expect(response.status).toBe(201)
    expect(response.body.question).toBeDefined()
    expect(response.body.question.questionTitle).toBe('Question 1')
  })

  it('should create a question with conditional rules', async () => {
    const survey = await request(app.getHttpServer())
      .post('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Survey 2',
        location: 'Location 2',
        type: 'Type 2',
      })

    // Create the question that will be depended on
    const dependsOnQuestion = await questionFactory.makePrismaQuestion({
      surveyId: new UniqueEntityID(survey.body.survey.id),
      questionNum: 1,
      accountId: new UniqueEntityID(userId),
    })

    // Create an option answer for the dependsOnQuestion
    const optionAnswer = await optionAnswerFactory.makePrismaOptionAnswer({
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
        surveyId: survey.body.survey.id,
        conditionalRules: [
          {
            dependsOnQuestionNumber: 1,
            dependsOnOptionNumber: 1,
          },
        ],
      })

    expect(response.status).toBe(201)
    expect(response.body.question).toBeDefined()
    expect(response.body.question.questionTitle).toBe('Question 2')
  })

  it('should return 400 if dependsOnQuestion is not found', async () => {
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
        surveyId: survey.body.survey.id,
        conditionalRules: [
          {
            dependsOnQuestionNumber: 9999,
            dependsOnOptionNumber: 1,
          },
        ],
      })

    expect(response.status).toBe(400)
  })

  it('should return 400 if dependsOnOption is not found', async () => {
    const survey = await request(app.getHttpServer())
      .post('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Survey 4',
        location: 'Location 4',
        type: 'Type 4',
      })

    // Create the question that will be depended on
    const dependsOnQuestion = await questionFactory.makePrismaQuestion({
      surveyId: new UniqueEntityID(survey.body.survey.id),
      questionNum: 1,
      accountId: new UniqueEntityID(userId),
    })

    const response = await request(app.getHttpServer())
      .post('/questions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        questionTitle: 'Question 4',
        questionNum: 4,
        surveyId: survey.body.survey.id,
        conditionalRules: [
          {
            dependsOnQuestionNumber: 1,
            dependsOnOptionNumber: 9999,
          },
        ],
      })

    expect(response.status).toBe(400)
  })
})
