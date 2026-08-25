import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { SessionService } from '@/infra/auth/session.service'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'
import { PrismaCompleteSurveyRepository } from '@/infra/database/prisma/repositories/prisma-complete-survey-repository'
import { Survey } from '@/domain/entities/survey'
import { Question } from '@/domain/entities/question'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

describe('Create survey (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let sessions: SessionService
  let accountFactory: AccountFactory

  beforeAll(async () => {
    const modularRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory],
    }).compile()

    app = modularRef.createNestApplication()
    prisma = modularRef.get(PrismaService)
    sessions = modularRef.get(SessionService)
    accountFactory = modularRef.get(AccountFactory)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('[POST] /surveys - should create survey with questions and options', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    // Payload com perguntas válidas para passar validação Zod
    const payload = {
      title: 'New survey',
      location: 'survey location',
      type: 'survey',
      questions: [
        {
          questionTitle: 'First question',
          questionNum: 1,
          options: [
            { optionTitle: 'Option 1', optionNum: 1 },
            { optionTitle: 'Option 2', optionNum: 2 },
          ],
        },
        {
          questionTitle: 'second question',
          questionNum: 2,
          options: [
            { optionTitle: 'Option 1', optionNum: 1 },
            { optionTitle: 'Option 2', optionNum: 2 },
          ],
        },
      ],
    }

    const response = await request(app.getHttpServer())
      .post('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)

    expect(response.statusCode).toBe(201)
    expect(response.body).toHaveProperty(
      'message',
      'Pesquisa criada com sucesso.',
    )
    expect(response.body).toHaveProperty('surveyId')

    const survey = await prisma.survey.findFirst({
      where: { title: 'New survey' },
    })

    expect(survey).toBeTruthy()

    const questions = await prisma.question.findMany({
      where: { surveyId: survey?.id },
    })

    expect(questions.length).toBe(2)

    const options = await prisma.optionAnswer.findMany({
      where: { questionId: questions[0].id },
    })

    expect(options.length).toBe(2)
  })

  test('[POST] /surveys - should create survey with conditional rules', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const payload = {
      title: 'Survey with conditional rules',
      location: 'survey location',
      type: 'survey',
      questions: [
        {
          questionTitle: 'First question',
          questionNum: 1,
          options: [
            { optionTitle: 'Option 1', optionNum: 1 },
            { optionTitle: 'Option 2', optionNum: 2 },
          ],
        },
        {
          questionTitle: 'Conditional question',
          questionNum: 2,
          conditionalRules: [
            {
              questionNum: 1,
              optionNum: 1,
            },
          ],
          options: [
            { optionTitle: 'Option 1', optionNum: 1 },
            { optionTitle: 'Option 2', optionNum: 2 },
          ],
        },
      ],
    }

    const response = await request(app.getHttpServer())
      .post('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)

    expect(response.statusCode).toBe(201)
    expect(response.body).toHaveProperty(
      'message',
      'Pesquisa criada com sucesso.',
    )
    expect(response.body).toHaveProperty('surveyId')

    const survey = await prisma.survey.findFirst({
      where: { title: 'Survey with conditional rules' },
    })

    expect(survey).toBeTruthy()

    const questions = await prisma.question.findMany({
      where: { surveyId: survey?.id },
      orderBy: [{ number: 'asc' }],
    })

    expect(questions.length).toBe(2)

    const conditionalRules = await prisma.conditionalRule.findMany({
      where: { surveyId: survey?.id },
    })

    expect(conditionalRules.length).toBe(1)
    expect(conditionalRules[0].dependsOnQuestionNumber).toBe(1)
    expect(conditionalRules[0].dependsOnOptionNumber).toBe(1)
  })

  test.each([
    {
      name: 'invalid question',
      title: 'Rollback invalid question',
      questions: [
        {
          questionTitle: 'Valid question',
          questionNum: 1,
          options: [{ optionTitle: 'Valid option', optionNum: 1 }],
        },
        { questionTitle: '', questionNum: 2, options: [] },
      ],
    },
    {
      name: 'invalid option',
      title: 'Rollback invalid option',
      questions: [
        {
          questionTitle: 'Valid question',
          questionNum: 1,
          options: [
            { optionTitle: 'Valid option', optionNum: 1 },
            { optionTitle: '', optionNum: 2 },
          ],
        },
      ],
    },
    {
      name: 'nonexistent conditional rule target',
      title: 'Rollback invalid rule',
      questions: [
        {
          questionTitle: 'Conditional question',
          questionNum: 1,
          options: [{ optionTitle: 'Valid option', optionNum: 1 }],
          conditionalRules: [{ questionNum: 999, optionNum: 1 }],
        },
      ],
    },
  ])('should not persist anything for $name', async ({ title, questions }) => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const response = await request(app.getHttpServer())
      .post('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title, location: 'location', type: 'survey', questions })

    expect(response.statusCode).toBe(400)
    expect(await prisma.survey.count({ where: { title } })).toBe(0)
    expect(
      await prisma.question.count({ where: { userId: user.id.toString() } }),
    ).toBe(0)
    expect(
      await prisma.optionAnswer.count({
        where: { userId: user.id.toString() },
      }),
    ).toBe(0)
  })

  test('should roll back the complete transaction on a constraint violation', async () => {
    const user = await accountFactory.makePrismaAccount()
    const repository = new PrismaCompleteSurveyRepository(prisma)
    const survey = Survey.create({
      title: 'Rollback constraint violation',
      location: 'location',
      type: 'survey',
      accountId: user.id,
    })
    const duplicateId = new UniqueEntityID()
    const questions = ['First question', 'Second question'].map(
      (questionTitle, index) =>
        Question.create(
          {
            questionTitle,
            questionNum: index + 1,
            surveyId: survey.id,
            accountId: user.id,
          },
          duplicateId,
        ),
    )

    await expect(
      repository.createComplete({
        survey,
        questions,
        options: [],
        conditionalRules: [],
      }),
    ).rejects.toThrow('persistence constraint')

    expect(
      await prisma.survey.findUnique({ where: { id: survey.id.toString() } }),
    ).toBeNull()
    expect(
      await prisma.question.count({
        where: { surveyId: survey.id.toString() },
      }),
    ).toBe(0)
  })
})
