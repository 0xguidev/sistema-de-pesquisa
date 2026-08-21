import { AppModule } from '@/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AccountFactory } from 'test/factories/make-Account'
import { QuestionFactory } from 'test/factories/make-question'
import { SurveyFactory } from 'test/factories/make-survey'
import { SessionService } from '@/infra/auth/session.service'

describe('Create option answer (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let accountFactory: AccountFactory
  let surveyFactory: SurveyFactory
  let questionFactory: QuestionFactory

  let sessions: SessionService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory, QuestionFactory, SurveyFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    accountFactory = moduleRef.get(AccountFactory)
    questionFactory = moduleRef.get(QuestionFactory)
    surveyFactory = moduleRef.get(SurveyFactory)
    sessions = moduleRef.get(SessionService)

    await app.init()
  })

  test('[POST] /option-answers', async () => {
    const user = await accountFactory.makePrismaAccount()
    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })
    const question = await questionFactory.makePrismaQuestion({
      surveyId: survey.id,
      accountId: user.id,
    })

    const accessToken = (await sessions.create(user.id.toString(), {}))
      .accessToken

    const response = await request(app.getHttpServer())
      .post('/option-answers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        optionTitle: 'new option',
        optionNum: 1,
        questionId: question.id.toString(),
      })

    expect(response.statusCode).toBe(201)

    const optionOnDatabase = await prisma.optionAnswer.findFirst({
      where: {
        option: 'new option',
        questionId: question.id.toString(),
        userId: user.id.toString(),
      },
    })

    expect(optionOnDatabase).toMatchObject({
      option: 'new option',
      number: 1,
      questionId: question.id.toString(),
      userId: user.id.toString(),
    })
  })

  test('[POST] /option-answers - 404 for another account question', async () => {
    const owner = await accountFactory.makePrismaAccount()
    const attacker = await accountFactory.makePrismaAccount()
    const survey = await surveyFactory.makePrismaSurvey({ accountId: owner.id })
    const question = await questionFactory.makePrismaQuestion({
      surveyId: survey.id,
      accountId: owner.id,
    })

    const response = await request(app.getHttpServer())
      .post('/option-answers')
      .set(
        'Authorization',
        `Bearer ${(await sessions.create(attacker.id.toString(), {})).accessToken}`,
      )
      .send({
        optionTitle: 'Forbidden option',
        optionNum: 1,
        questionId: question.id.toString(),
      })

    expect(response.statusCode).toBe(404)
    expect(
      await prisma.optionAnswer.findFirst({
        where: { option: 'Forbidden option' },
      }),
    ).toBeNull()
  })
})
