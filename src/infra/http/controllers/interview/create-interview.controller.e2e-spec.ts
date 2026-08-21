import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'
import { SurveyFactory } from 'test/factories/make-survey'
import { SessionService } from '@/infra/auth/session.service'

describe('Create interview (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let sessions: SessionService
  let accountFactory: AccountFactory
  let surveyFactory: SurveyFactory

  beforeAll(async () => {
    const modularRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory, SurveyFactory],
    }).compile()

    app = modularRef.createNestApplication()
    prisma = modularRef.get(PrismaService)
    sessions = modularRef.get(SessionService)
    accountFactory = modularRef.get(AccountFactory)
    surveyFactory = modularRef.get(SurveyFactory)

    await app.init()
  })

  test('[POST] /interviews', async () => {
    const user = await accountFactory.makePrismaAccount()
    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })

    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const response = await request(app.getHttpServer())
      .post('/interviews')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        surveyId: survey.id.toString(),
        answers: [],
      })

    expect(response.statusCode).toBe(201)

    const interviewOnDatabase = await prisma.interview.findFirst({
      where: {
        surveyId: survey.id.toString(),
        userId: user.id.toString(),
      },
    })

    expect(interviewOnDatabase).toMatchObject({
      surveyId: survey.id.toString(),
      userId: user.id.toString(),
    })
  })

  test('[POST] /interviews - 404 for another account survey', async () => {
    const owner = await accountFactory.makePrismaAccount()
    const attacker = await accountFactory.makePrismaAccount()
    const survey = await surveyFactory.makePrismaSurvey({ accountId: owner.id })

    const response = await request(app.getHttpServer())
      .post('/interviews')
      .set(
        'Authorization',
        `Bearer ${(await sessions.create(attacker.id.toString(), {})).accessToken}`,
      )
      .send({ surveyId: survey.id.toString(), answers: [] })

    expect(response.statusCode).toBe(404)
    expect(
      await prisma.interview.findFirst({
        where: {
          surveyId: survey.id.toString(),
          userId: attacker.id.toString(),
        },
      }),
    ).toBeNull()
  })
})
