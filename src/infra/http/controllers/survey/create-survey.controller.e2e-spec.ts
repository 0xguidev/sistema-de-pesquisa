import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'

describe('Create survey (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let accountFactory: AccountFactory

  beforeAll(async () => {
    const modularRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory],
    }).compile()

    app = modularRef.createNestApplication()
    prisma = modularRef.get(PrismaService)
    jwt = modularRef.get(JwtService)
    accountFactory = modularRef.get(AccountFactory)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('[POST] /surveys - should create survey with questions and options', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = jwt.sign({ sub: user.id.toString() })

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
    expect(response.body).toHaveProperty('message', 'Pesquisa criada com sucesso.')
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
    const accessToken = jwt.sign({ sub: user.id.toString() })

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
    expect(response.body).toHaveProperty('message', 'Pesquisa criada com sucesso.')
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
})
