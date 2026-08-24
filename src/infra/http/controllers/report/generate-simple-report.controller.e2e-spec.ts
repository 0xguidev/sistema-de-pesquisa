import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '@/app.module'
import { SessionService } from '@/infra/auth/session.service'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

const IDS = {
  owner: '10000000-0000-4000-8000-000000000001',
  outsider: '10000000-0000-4000-8000-000000000002',
  survey: '20000000-0000-4000-8000-000000000001',
  emptySurvey: '20000000-0000-4000-8000-000000000002',
  qColor: '30000000-0000-4000-8000-000000000001',
  qRegion: '30000000-0000-4000-8000-000000000002',
  qWithoutOptions: '30000000-0000-4000-8000-000000000003',
  blue: '40000000-0000-4000-8000-000000000001',
  red: '40000000-0000-4000-8000-000000000002',
  north: '40000000-0000-4000-8000-000000000003',
  south: '40000000-0000-4000-8000-000000000004',
}

describe('Generate simple report (E2E)', () => {
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
          id: IDS.owner,
          email: 'simple-owner@example.com',
          password: 'unused',
          name: 'Owner',
          slug: 'simple-owner',
        },
        {
          id: IDS.outsider,
          email: 'simple-outsider@example.com',
          password: 'unused',
          name: 'Outsider',
          slug: 'simple-outsider',
        },
      ],
    })
    token = (await moduleRef.get(SessionService).create(IDS.owner, {}))
      .accessToken
  })

  afterAll(async () => app.close())

  async function arrangeReport() {
    await prisma.survey.createMany({
      data: [
        {
          id: IDS.survey,
          title: 'Simple survey',
          location: 'Recife',
          type: 'Opinion',
          userId: IDS.owner,
          slug: 'simple-survey',
        },
        {
          id: IDS.emptySurvey,
          title: 'Empty survey',
          location: 'Recife',
          type: 'Opinion',
          userId: IDS.owner,
          slug: 'empty-simple-survey',
        },
      ],
    })
    await prisma.question.createMany({
      data: [
        {
          id: IDS.qColor,
          title: 'Favorite color',
          number: 2,
          surveyId: IDS.survey,
          userId: IDS.owner,
          slug: 'simple-color',
        },
        {
          id: IDS.qRegion,
          title: 'Region',
          number: 1,
          surveyId: IDS.survey,
          userId: IDS.owner,
          slug: 'simple-region',
        },
        {
          id: IDS.qWithoutOptions,
          title: 'Question without options',
          number: 3,
          surveyId: IDS.survey,
          userId: IDS.owner,
          slug: 'simple-no-options',
        },
      ],
    })
    await prisma.optionAnswer.createMany({
      data: [
        {
          id: IDS.blue,
          option: 'Blue',
          number: 2,
          questionId: IDS.qColor,
          userId: IDS.owner,
          slug: 'simple-blue',
        },
        {
          id: IDS.red,
          option: 'Red',
          number: 1,
          questionId: IDS.qColor,
          userId: IDS.owner,
          slug: 'simple-red',
        },
        {
          id: IDS.north,
          option: 'North',
          number: 2,
          questionId: IDS.qRegion,
          userId: IDS.owner,
          slug: 'simple-north',
        },
        {
          id: IDS.south,
          option: 'South',
          number: 1,
          questionId: IDS.qRegion,
          userId: IDS.owner,
          slug: 'simple-south',
        },
      ],
    })
    const interviewIds = [1, 2, 3].map(
      (n) => `50000000-0000-4000-8000-00000000000${n}`,
    )
    await prisma.interview.createMany({
      data: interviewIds.map((id) => ({
        id,
        surveyId: IDS.survey,
        userId: IDS.owner,
      })),
    })
    await prisma.answerQuestion.createMany({
      data: [
        {
          id: '60000000-0000-4000-8000-000000000001',
          interviewId: interviewIds[0],
          surveyId: IDS.survey,
          questionId: IDS.qColor,
          optionAnswerId: IDS.blue,
          userId: IDS.owner,
        },
        {
          id: '60000000-0000-4000-8000-000000000002',
          interviewId: interviewIds[0],
          surveyId: IDS.survey,
          questionId: IDS.qRegion,
          optionAnswerId: IDS.south,
          userId: IDS.owner,
        },
        {
          id: '60000000-0000-4000-8000-000000000003',
          interviewId: interviewIds[1],
          surveyId: IDS.survey,
          questionId: IDS.qColor,
          optionAnswerId: IDS.red,
          userId: IDS.owner,
        },
        {
          id: '60000000-0000-4000-8000-000000000004',
          interviewId: interviewIds[1],
          surveyId: IDS.survey,
          questionId: IDS.qRegion,
          optionAnswerId: IDS.north,
          userId: IDS.owner,
        },
        {
          id: '60000000-0000-4000-8000-000000000005',
          interviewId: interviewIds[2],
          surveyId: IDS.survey,
          questionId: IDS.qColor,
          optionAnswerId: IDS.blue,
          userId: IDS.owner,
        },
      ],
    })
  }

  it('returns complete ordered content, handles incomplete answers and excludes another tenant', async () => {
    await arrangeReport()
    const response = await request(app.getHttpServer())
      .get(`/reports/simple/${IDS.survey}`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(response.body).toEqual([
      {
        questionId: IDS.qRegion,
        questionNum: 1,
        questionTitle: 'Region',
        options: [
          { num: 1, answer: 'South', percentage: 33.33 },
          { num: 2, answer: 'North', percentage: 33.33 },
        ],
      },
      {
        questionId: IDS.qColor,
        questionNum: 2,
        questionTitle: 'Favorite color',
        options: [
          { num: 1, answer: 'Red', percentage: 33.33 },
          { num: 2, answer: 'Blue', percentage: 66.67 },
        ],
      },
    ])
    expect(JSON.stringify(response.body)).not.toContain(
      'Question without options',
    )
  })

  it('returns an empty array when there are no interviews', async () => {
    const response = await request(app.getHttpServer())
      .get(`/reports/simple/${IDS.emptySurvey}`)
      .auth(token, { type: 'bearer' })
      .expect(200)
    expect(response.body).toEqual([])
  })
})
