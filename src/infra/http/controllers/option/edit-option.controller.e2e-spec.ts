import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '@/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { SessionService } from '@/infra/auth/session.service'
import { AccountFactory } from 'test/factories/make-Account'
import { SurveyFactory } from 'test/factories/make-survey'
import { QuestionFactory } from 'test/factories/make-question'
import { OptionAnswerFactory } from 'test/factories/make-option-answer'
import { DatabaseModule } from '@/infra/database/database.module'

describe('Edit option answer (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let sessions: SessionService
  let accounts: AccountFactory
  let surveys: SurveyFactory
  let questions: QuestionFactory
  let options: OptionAnswerFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        AccountFactory,
        SurveyFactory,
        QuestionFactory,
        OptionAnswerFactory,
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    sessions = moduleRef.get(SessionService)
    accounts = moduleRef.get(AccountFactory)
    surveys = moduleRef.get(SurveyFactory)
    questions = moduleRef.get(QuestionFactory)
    options = moduleRef.get(OptionAnswerFactory)
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  async function arrangeOption() {
    const account = await accounts.makePrismaAccount()
    const survey = await surveys.makePrismaSurvey({ accountId: account.id })
    const question = await questions.makePrismaQuestion({
      accountId: account.id,
      surveyId: survey.id,
    })
    const option = await options.makePrismaOptionAnswer({
      accountId: account.id,
      questionId: question.id,
    })
    const token = (await sessions.create(account.id.toString(), {})).accessToken
    return { option, token }
  }

  test('[PUT] /option-answers/:id updates title and number', async () => {
    const { option, token } = await arrangeOption()

    await request(app.getHttpServer())
      .put(`/option-answers/${option.id.toString()}`)
      .auth(token, { type: 'bearer' })
      .send({ title: 'Updated option', num: 7 })
      .expect(204)

    const persisted = await prisma.optionAnswer.findUnique({
      where: { id: option.id.toString() },
    })
    expect(persisted).toMatchObject({ option: 'Updated option', number: 7 })
  })

  test('[PUT] /option-answers/:id rejects empty payload', async () => {
    const { option, token } = await arrangeOption()
    await request(app.getHttpServer())
      .put(`/option-answers/${option.id.toString()}`)
      .auth(token, { type: 'bearer' })
      .send({})
      .expect(400)
  })

  test('[PUT] /option-answers/:id rejects another account', async () => {
    const { option } = await arrangeOption()
    const attacker = await accounts.makePrismaAccount()
    const token = (await sessions.create(attacker.id.toString(), {}))
      .accessToken

    await request(app.getHttpServer())
      .put(`/option-answers/${option.id.toString()}`)
      .auth(token, { type: 'bearer' })
      .send({ title: 'Forbidden' })
      .expect(404)

    const persisted = await prisma.optionAnswer.findUnique({
      where: { id: option.id.toString() },
    })
    expect(persisted?.option).not.toBe('Forbidden')
  })
})
