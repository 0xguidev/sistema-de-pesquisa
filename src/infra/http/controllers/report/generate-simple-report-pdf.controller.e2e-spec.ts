import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '@/app.module'
import { SessionService } from '@/infra/auth/session.service'
import { AccountFactory } from 'test/factories/make-Account'
import { SurveyFactory } from 'test/factories/make-survey'
import { InterviewFactory } from 'test/factories/make-interview'
import { DatabaseModule } from '@/infra/database/database.module'
import { IncomingMessage } from 'node:http'

function parseBinary(
  response: IncomingMessage,
  callback: (error: Error | null, body?: Buffer) => void,
) {
  const chunks: Buffer[] = []
  response.on('data', (chunk: Buffer) => chunks.push(chunk))
  response.on('end', () => callback(null, Buffer.concat(chunks)))
}

describe('Generate simple report PDF (E2E)', () => {
  let app: INestApplication
  let sessions: SessionService
  let accounts: AccountFactory
  let surveys: SurveyFactory
  let interviews: InterviewFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory, SurveyFactory, InterviewFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    sessions = moduleRef.get(SessionService)
    accounts = moduleRef.get(AccountFactory)
    surveys = moduleRef.get(SurveyFactory)
    interviews = moduleRef.get(InterviewFactory)
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('[GET] /reports/simple-pdf/:surveyId returns a valid PDF', async () => {
    const account = await accounts.makePrismaAccount()
    const survey = await surveys.makePrismaSurvey({
      accountId: account.id,
      title: 'Quality Survey',
    })
    await interviews.makePrismaInterview({
      accountId: account.id,
      surveyId: survey.id,
    })
    const token = (await sessions.create(account.id.toString(), {})).accessToken

    const response = await request(app.getHttpServer())
      .get(`/reports/simple-pdf/${survey.id.toString()}`)
      .auth(token, { type: 'bearer' })
      .buffer(true)
      .parse(parseBinary)
      .expect('Content-Type', /application\/pdf/)
      .expect('Content-Disposition', /relatorio-simples-Quality-Survey-/)
      .expect(200)

    expect(Buffer.isBuffer(response.body)).toBe(true)
    expect(response.body.length).toBeGreaterThan(1_000)
    expect(response.body.subarray(0, 5).toString()).toBe('%PDF-')
  })
})
