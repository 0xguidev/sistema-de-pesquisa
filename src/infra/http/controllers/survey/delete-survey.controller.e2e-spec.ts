import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { SessionService } from '@/infra/auth/session.service'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { SurveyFactory } from 'test/factories/make-survey'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'

describe('Delete survey (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let sessions: SessionService
  let surveyFactory: SurveyFactory
  let accountFactory: AccountFactory

  beforeAll(async () => {
    const modularRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory, SurveyFactory],
    }).compile()

    app = modularRef.createNestApplication()
    prisma = modularRef.get(PrismaService)
    sessions = modularRef.get(SessionService)
    surveyFactory = modularRef.get(SurveyFactory)
    accountFactory = modularRef.get(AccountFactory)

    await app.init()
  })

  test('[DELETE] /surveys/:id', async () => {
    const user = await accountFactory.makePrismaAccount()

    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })

    const surveyId = survey.id.toString()

    const response = await request(app.getHttpServer())
      .delete(`/surveys/${surveyId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(204)

    const surveyOnDatabase = await prisma.survey.findUnique({
      where: {
        id: surveyId,
      },
    })

    expect(surveyOnDatabase).toBeNull()
  })
})
