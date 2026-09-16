import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { SessionService } from '@/infra/auth/session.service'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('List surveys (E2E)', () => {
  let app: INestApplication
  let sessions: SessionService
  let accountFactory: AccountFactory
  let prisma: PrismaService

  beforeAll(async () => {
    const modularRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory],
    }).compile()

    app = modularRef.createNestApplication()
    sessions = modularRef.get(SessionService)
    accountFactory = modularRef.get(AccountFactory)
    prisma = modularRef.get(PrismaService)

    await app.init()
  })
  test('[GET] /surveys', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const surveys = Array.from({ length: 15 }, (_, i) => ({
      id: `00000000-0000-4000-8000-${String(15 - i).padStart(12, '0')}`,
      title: `Survey ${i}`,
      location: 'Survey location',
      type: 'Survey type',
      slug: `survey-${i}`,
      userId: user.id.toString(),
      createdAt: new Date(Date.UTC(2026, 0, 1 + Math.floor(i / 3))),
    }))
    await prisma.survey.createMany({ data: surveys })

    const otherUser = await accountFactory.makePrismaAccount()
    await prisma.survey.create({
      data: {
        title: 'Another user survey',
        location: 'Survey location',
        type: 'Survey type',
        slug: 'another-user-survey',
        userId: otherUser.id.toString(),
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
      },
    })

    // Dates descend; within each date, lower indices have higher IDs.
    // The group at indices 3, 4 and 5 crosses the page boundary.
    const expectedSurveys = [12, 13, 14, 9, 10, 11, 6, 7, 8, 3, 4, 5, 0, 1, 2].map(
      (index) => ({ id: surveys[index].id, title: surveys[index].title }),
    )

    const response = await request(app.getHttpServer())
      .get('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ page: 1 })

    expect(response.statusCode).toBe(200)
    expect(response.body.length).toBe(10)
    expect(response.body).toEqual(expectedSurveys.slice(0, 10))

    const responsePage2 = await request(app.getHttpServer())
      .get('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ page: 2 })

    expect(responsePage2.statusCode).toBe(200)
    expect(responsePage2.body.length).toBe(5)
    expect(responsePage2.body).toEqual(expectedSurveys.slice(10))
  })

  test('[GET] /surveys - should return empty list if there are no surveys', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const response = await request(app.getHttpServer())
      .get('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ page: 1 })

    expect(response.statusCode).toBe(200)
    expect(response.body.length).toBe(0)
  })

  test('[GET] /surveys - should return 400 if page is not a number', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const response = await request(app.getHttpServer())
      .get('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ page: 'invalid' })

    expect(response.statusCode).toBe(400)
  })

  test('[GET] /surveys - should return 400 if page is less than 1', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const response = await request(app.getHttpServer())
      .get('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ page: 0 })

    expect(response.statusCode).toBe(400)
  })
})
