import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '@/app.module'
import { SessionService } from '@/infra/auth/session.service'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

const ID = {
  owner: '11000000-0000-4000-8000-000000000001',
  outsider: '11000000-0000-4000-8000-000000000002',
  survey: '21000000-0000-4000-8000-000000000001',
  empty: '21000000-0000-4000-8000-000000000002',
  oneQuestion: '21000000-0000-4000-8000-000000000003',
  qA: '31000000-0000-4000-8000-000000000001',
  qB: '31000000-0000-4000-8000-000000000002',
  qEmpty: '31000000-0000-4000-8000-000000000003',
  qOnly: '31000000-0000-4000-8000-000000000004',
  a1: '41000000-0000-4000-8000-000000000001',
  a2: '41000000-0000-4000-8000-000000000002',
  b1: '41000000-0000-4000-8000-000000000003',
  b2: '41000000-0000-4000-8000-000000000004',
  only: '41000000-0000-4000-8000-000000000005',
}

describe('Generate cross report (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let token: string

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()
    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    await app.init()
    await prisma.user.createMany({
      data: [
        {
          id: ID.owner,
          email: 'cross-owner@example.com',
          password: 'unused',
          name: 'Owner',
          slug: 'cross-owner',
        },
        {
          id: ID.outsider,
          email: 'cross-outsider@example.com',
          password: 'unused',
          name: 'Outsider',
          slug: 'cross-outsider',
        },
      ],
    })
    token = (await moduleRef.get(SessionService).create(ID.owner, {}))
      .accessToken
  })

  afterAll(async () => app.close())

  async function arrange() {
    await prisma.survey.createMany({
      data: [
        {
          id: ID.survey,
          title: 'Cross survey',
          location: 'Recife',
          type: 'Opinion',
          userId: ID.owner,
          slug: 'cross-survey',
        },
        {
          id: ID.empty,
          title: 'Empty cross',
          location: 'Recife',
          type: 'Opinion',
          userId: ID.owner,
          slug: 'empty-cross',
        },
        {
          id: ID.oneQuestion,
          title: 'One question',
          location: 'Recife',
          type: 'Opinion',
          userId: ID.owner,
          slug: 'one-question-cross',
        },
      ],
    })
    await prisma.question.createMany({
      data: [
        {
          id: ID.qA,
          title: 'Age group',
          number: 2,
          surveyId: ID.survey,
          userId: ID.owner,
          slug: 'cross-age',
        },
        {
          id: ID.qB,
          title: 'Candidate',
          number: 1,
          surveyId: ID.survey,
          userId: ID.owner,
          slug: 'cross-candidate',
        },
        {
          id: ID.qEmpty,
          title: 'No options',
          number: 3,
          surveyId: ID.survey,
          userId: ID.owner,
          slug: 'cross-no-options',
        },
        {
          id: ID.qOnly,
          title: 'Only question',
          number: 1,
          surveyId: ID.oneQuestion,
          userId: ID.owner,
          slug: 'cross-only-question',
        },
      ],
    })
    await prisma.optionAnswer.createMany({
      data: [
        {
          id: ID.a1,
          option: '18-29',
          number: 2,
          questionId: ID.qA,
          userId: ID.owner,
          slug: 'cross-a1',
        },
        {
          id: ID.a2,
          option: '30-44',
          number: 1,
          questionId: ID.qA,
          userId: ID.owner,
          slug: 'cross-a2',
        },
        {
          id: ID.b1,
          option: 'Candidate A',
          number: 2,
          questionId: ID.qB,
          userId: ID.owner,
          slug: 'cross-b1',
        },
        {
          id: ID.b2,
          option: 'Candidate B',
          number: 1,
          questionId: ID.qB,
          userId: ID.owner,
          slug: 'cross-b2',
        },
        {
          id: ID.only,
          option: 'Only option',
          number: 1,
          questionId: ID.qOnly,
          userId: ID.owner,
          slug: 'cross-only-option',
        },
      ],
    })
    const interviews = [1, 2, 3].map(
      (n) => `51000000-0000-4000-8000-00000000000${n}`,
    )
    await prisma.interview.createMany({
      data: interviews.map((id) => ({
        id,
        surveyId: ID.survey,
        userId: ID.owner,
      })),
    })
    await prisma.answerQuestion.createMany({
      data: [
        {
          id: '61000000-0000-4000-8000-000000000001',
          interviewId: interviews[0],
          questionId: ID.qA,
          optionAnswerId: ID.a1,
          userId: ID.owner,
        },
        {
          id: '61000000-0000-4000-8000-000000000002',
          interviewId: interviews[0],
          questionId: ID.qB,
          optionAnswerId: ID.b1,
          userId: ID.owner,
        },
        {
          id: '61000000-0000-4000-8000-000000000003',
          interviewId: interviews[1],
          questionId: ID.qA,
          optionAnswerId: ID.a1,
          userId: ID.owner,
        },
        {
          id: '61000000-0000-4000-8000-000000000004',
          interviewId: interviews[1],
          questionId: ID.qB,
          optionAnswerId: ID.b2,
          userId: ID.owner,
        },
        {
          id: '61000000-0000-4000-8000-000000000005',
          interviewId: interviews[2],
          questionId: ID.qA,
          optionAnswerId: ID.a2,
          userId: ID.owner,
        },
      ],
    })
    await prisma.interview.create({
      data: {
        id: '51000000-0000-4000-8000-000000000009',
        surveyId: ID.survey,
        userId: ID.outsider,
      },
    })
    await prisma.answerQuestion.createMany({
      data: [
        {
          id: '61000000-0000-4000-8000-000000000009',
          interviewId: '51000000-0000-4000-8000-000000000009',
          questionId: ID.qA,
          optionAnswerId: ID.a2,
          userId: ID.outsider,
        },
        {
          id: '61000000-0000-4000-8000-000000000010',
          interviewId: '51000000-0000-4000-8000-000000000009',
          questionId: ID.qB,
          optionAnswerId: ID.b2,
          userId: ID.outsider,
        },
      ],
    })
    await prisma.interview.create({
      data: {
        id: '51000000-0000-4000-8000-000000000008',
        surveyId: ID.oneQuestion,
        userId: ID.owner,
      },
    })
  }

  it('returns every ordered combination with exact rounded percentages and tenant isolation', async () => {
    await arrange()
    const response = await request(app.getHttpServer())
      .get(`/reports/cross/${ID.survey}`)
      .auth(token, { type: 'bearer' })
      .expect(200)
    expect(response.body).toEqual([
      {
        questionA: 'Candidate',
        questionANum: 1,
        questionAId: ID.qB,
        questionB: 'Age group',
        questionBNum: 2,
        questionBId: ID.qA,
        answers: [
          {
            numA: 1,
            answerA: 'Candidate B',
            numB: 1,
            answerB: '30-44',
            percentage: 0,
          },
          {
            numA: 1,
            answerA: 'Candidate B',
            numB: 2,
            answerB: '18-29',
            percentage: 33.33,
          },
          {
            numA: 2,
            answerA: 'Candidate A',
            numB: 1,
            answerB: '30-44',
            percentage: 0,
          },
          {
            numA: 2,
            answerA: 'Candidate A',
            numB: 2,
            answerB: '18-29',
            percentage: 33.33,
          },
        ],
      },
    ])
    expect(JSON.stringify(response.body)).not.toContain('No options')
  })

  it('returns an empty array when there are no interviews', async () => {
    const response = await request(app.getHttpServer())
      .get(`/reports/cross/${ID.empty}`)
      .auth(token, { type: 'bearer' })
      .expect(200)
    expect(response.body).toEqual([])
  })

  it('rejects a cross report with fewer than two questions', async () => {
    const response = await request(app.getHttpServer())
      .get(`/reports/cross/${ID.oneQuestion}`)
      .auth(token, { type: 'bearer' })
      .expect(400)
    expect(response.body).toEqual({
      statusCode: 400,
      message:
        'São necessárias pelo menos duas perguntas para gerar relatório cruzado',
      error: 'Bad Request',
    })
  })
})
