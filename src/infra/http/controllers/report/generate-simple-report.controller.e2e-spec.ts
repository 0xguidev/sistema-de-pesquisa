import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '@/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { hash } from 'bcryptjs'

describe('GenerateSimpleReportController (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    prisma = moduleFixture.get(PrismaService)
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should generate simple report', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: await hash('password', 8),
        name: 'Test User',
        slug: 'test-user',
      },
    })

    const survey = await prisma.survey.create({
      data: {
        title: 'Test Survey',
        location: 'Test Location',
        type: 'Test Type',
        userId: user.id,
        slug: 'test-survey',
      },
    })

    const question = await prisma.question.create({
      data: {
        title: 'Test Question',
        number: 1,
        surveyId: survey.id,
        userId: user.id,
        slug: 'test-question',
      },
    })

    const option1 = await prisma.optionAnswer.create({
      data: {
        option: 'Yes',
        number: 1,
        questionId: question.id,
        userId: user.id,
        slug: 'yes-option',
      },
    })

    const option2 = await prisma.optionAnswer.create({
      data: {
        option: 'No',
        number: 2,
        questionId: question.id,
        userId: user.id,
        slug: 'no-option',
      },
    })

    const interview = await prisma.interview.create({
      data: {
        surveyId: survey.id,
        userId: user.id,
      },
    })

    await prisma.answerQuestion.create({
      data: {
        interviewId: interview.id,
        questionId: question.id,
        optionAnswerId: option1.id,
        userId: user.id,
      },
    })

    const authResponse = await request(app.getHttpServer())
      .post('/sessions')
      .send({
        email: 'test@example.com',
        password: 'password',
      })

    const accessToken = authResponse.body.access_token

    const response = await request(app.getHttpServer())
      .get(`/reports/simple/${survey.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(response.body).toBeInstanceOf(Array)
    expect(response.body.length).toBeGreaterThan(0)
    expect(response.body[0]).toHaveProperty('questionId')
    expect(response.body[0]).toHaveProperty('questionNum')
    expect(response.body[0]).toHaveProperty('options')
    expect(response.body[0].options[0]).toHaveProperty('num')
  })
})
