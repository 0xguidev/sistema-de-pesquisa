import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '@/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { hash } from 'bcryptjs'

describe('GenerateCrossTabulationController (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    prisma = moduleFixture.get(PrismaService)
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should generate cross tabulation report', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test2@example.com',
        password: await hash('password', 8),
        name: 'Test User 2',
        slug: 'test-user-2',
      },
    })

    const survey = await prisma.survey.create({
      data: {
        title: 'Test Survey 2',
        location: 'Test Location 2',
        type: 'Test Type 2',
        userId: user.id,
        slug: 'test-survey-2',
      },
    })

    const question1 = await prisma.question.create({
      data: {
        title: 'Test Question 1',
        number: 1,
        surveyId: survey.id,
        userId: user.id,
        slug: 'test-question-1',
      },
    })

    const question2 = await prisma.question.create({
      data: {
        title: 'Test Question 2',
        number: 2,
        surveyId: survey.id,
        userId: user.id,
        slug: 'test-question-2',
      },
    })

    const option1Q1 = await prisma.optionAnswer.create({
      data: {
        option: 'Yes',
        number: 1,
        questionId: question1.id,
        userId: user.id,
        slug: 'yes-option-q1',
      },
    })

    const option2Q1 = await prisma.optionAnswer.create({
      data: {
        option: 'No',
        number: 2,
        questionId: question1.id,
        userId: user.id,
        slug: 'no-option-q1',
      },
    })

    const option1Q2 = await prisma.optionAnswer.create({
      data: {
        option: 'True',
        number: 1,
        questionId: question2.id,
        userId: user.id,
        slug: 'true-option-q2',
      },
    })

    const option2Q2 = await prisma.optionAnswer.create({
      data: {
        option: 'False',
        number: 2,
        questionId: question2.id,
        userId: user.id,
        slug: 'false-option-q2',
      },
    })

    const interview = await prisma.interview.create({
      data: {
        surveyId: survey.id,
        userId: user.id,
      },
    })

    await prisma.answerQuestion.createMany({
      data: [
        {
          interviewId: interview.id,
          questionId: question1.id,
          optionAnswerId: option1Q1.id,
          userId: user.id,
        },
        {
          interviewId: interview.id,
          questionId: question2.id,
          optionAnswerId: option2Q2.id,
          userId: user.id,
        },
      ],
    })

    const authResponse = await request(app.getHttpServer())
      .post('/sessions')
      .send({
        email: 'test2@example.com',
        password: 'password',
      })

    const accessToken = authResponse.body.access_token

    const response = await request(app.getHttpServer())
      .get(`/reports/cross/${survey.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(response.body).toBeInstanceOf(Array)
    expect(response.body.length).toBeGreaterThan(0)
    expect(response.body[0]).toHaveProperty('questionAId')
    expect(response.body[0]).toHaveProperty('questionBId')
    expect(response.body[0]).toHaveProperty('answers')
  })
})
