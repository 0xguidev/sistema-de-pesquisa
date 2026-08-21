import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { SessionService } from '@/infra/auth/session.service'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { InterviewFactory } from 'test/factories/make-interview'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'
import { SurveyFactory } from 'test/factories/make-survey'

describe('Delete interview (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let sessions: SessionService
  let interviewFactory: InterviewFactory
  let accountFactory: AccountFactory
  let surveyFactory: SurveyFactory

  beforeAll(async () => {
    const modularRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory, InterviewFactory, SurveyFactory],
    }).compile()

    app = modularRef.createNestApplication()
    prisma = modularRef.get(PrismaService)
    sessions = modularRef.get(SessionService)
    interviewFactory = modularRef.get(InterviewFactory)
    accountFactory = modularRef.get(AccountFactory)
    surveyFactory = modularRef.get(SurveyFactory)

    await app.init()
  })

  test('[DELETE] /interviews/:id', async () => {
    const user = await accountFactory.makePrismaAccount()

    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })

    const interview = await interviewFactory.makePrismaInterview({
      accountId: user.id,
      surveyId: survey.id,
    })

    const interviewId = interview.id.toString()

    const isInterviewExists = await prisma.interview.findUnique({
      where: {
        id: interviewId,
      },
    })

    expect(isInterviewExists).toBeTruthy()

    const response = await request(app.getHttpServer())
      .delete(`/interviews/${interviewId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(204)

    const interviewOnDatabase = await prisma.interview.findUnique({
      where: {
        id: interviewId,
      },
    })

    expect(interviewOnDatabase).toBeNull()
  })
})
