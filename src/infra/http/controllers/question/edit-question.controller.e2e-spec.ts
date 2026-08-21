import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { SessionService } from '@/infra/auth/session.service'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { QuestionFactory } from 'test/factories/make-question'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'
import { SurveyFactory } from 'test/factories/make-survey'

describe('Edit question (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let sessions: SessionService
  let questionFactory: QuestionFactory
  let accountFactory: AccountFactory
  let surveyFactory: SurveyFactory

  beforeAll(async () => {
    const modularRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory, QuestionFactory, SurveyFactory],
    }).compile()

    app = modularRef.createNestApplication()
    prisma = modularRef.get(PrismaService)
    sessions = modularRef.get(SessionService)
    questionFactory = modularRef.get(QuestionFactory)
    accountFactory = modularRef.get(AccountFactory)
    surveyFactory = modularRef.get(SurveyFactory)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('[PUT] /questions/:id - edit title and num', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })

    const question = await questionFactory.makePrismaQuestion({
      accountId: user.id,
      surveyId: survey.id,
      questionNum: 1,
    })

    const response = await request(app.getHttpServer())
      .put(`/questions/${question.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'New title',
        num: 2,
      })

    expect(response.statusCode).toBe(204)

    const questionOnDatabase = await prisma.question.findUnique({
      where: { id: question.id.toString() },
    })

    expect(questionOnDatabase?.title).toBe('New title')
    expect(questionOnDatabase?.number).toBe(2)
  })

  test('[PUT] /questions/:id - edit only title, keeps existing num', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })

    const question = await questionFactory.makePrismaQuestion({
      accountId: user.id,
      surveyId: survey.id,
      questionNum: 5,
    })

    const response = await request(app.getHttpServer())
      .put(`/questions/${question.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Only title changed',
      })

    expect(response.statusCode).toBe(204)

    const questionOnDatabase = await prisma.question.findUnique({
      where: { id: question.id.toString() },
    })

    expect(questionOnDatabase?.title).toBe('Only title changed')
    expect(questionOnDatabase?.number).toBe(5)
  })

  test('[PUT] /questions/:id - 400 when neither title nor num is sent', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })

    const question = await questionFactory.makePrismaQuestion({
      accountId: user.id,
      surveyId: survey.id,
    })

    const response = await request(app.getHttpServer())
      .put(`/questions/${question.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})

    expect(response.statusCode).toBe(400)
  })

  test('[PUT] /questions/:id - 400 with invalid payload types', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })

    const question = await questionFactory.makePrismaQuestion({
      accountId: user.id,
      surveyId: survey.id,
    })

    const response = await request(app.getHttpServer())
      .put(`/questions/${question.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        num: 'not-a-number',
      })

    expect(response.statusCode).toBe(400)
  })

  test('[PUT] /questions/:id - 404 if question does not exist', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const response = await request(app.getHttpServer())
      .put('/questions/non-existing-id')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'New title' })

    expect(response.statusCode).toBe(404)
  })

  test('[PUT] /questions/:id - 403 if user is not the question owner', async () => {
    const owner = await accountFactory.makePrismaAccount()
    const otherUser = await accountFactory.makePrismaAccount()
    const otherUserAccessToken = (
      await sessions.create(otherUser.id.toString(), {})
    ).accessToken

    const survey = await surveyFactory.makePrismaSurvey({
      accountId: owner.id,
    })

    const question = await questionFactory.makePrismaQuestion({
      accountId: owner.id,
      surveyId: survey.id,
    })

    const response = await request(app.getHttpServer())
      .put(`/questions/${question.id.toString()}`)
      .set('Authorization', `Bearer ${otherUserAccessToken}`)
      .send({ title: 'Hacked title' })

    expect(response.statusCode).toBe(403)

    const questionOnDatabase = await prisma.question.findUnique({
      where: { id: question.id.toString() },
    })

    expect(questionOnDatabase?.title).not.toBe('Hacked title')
  })

  test('[PUT] /questions/:id - 401 without access token', async () => {
    const response = await request(app.getHttpServer())
      .put('/questions/any-id')
      .send({ title: 'New title' })

    expect(response.statusCode).toBe(401)
  })
})
