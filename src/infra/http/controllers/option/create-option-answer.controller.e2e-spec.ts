import { AppModule } from '@/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AccountFactory } from 'test/factories/make-Account'
import { QuestionFactory } from 'test/factories/make-question'
import { SurveyFactory } from 'test/factories/make-survey'

describe('Create option answer (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let accountFactory: AccountFactory
  let surveyFactory: SurveyFactory
  let questionFactory: QuestionFactory

  let jwt: JwtService

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
    jwt = moduleRef.get(JwtService)

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

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .post('/option-answers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        optionTitle: 'new option',
        optionNum: 1,
        questionId: question.id.toString(),
      })

    expect(response.statusCode).toBe(201)

    const questionOnDatabase = await prisma.optionAnswer.findFirst({
      where: {
        option: 'new option',
      },
    })

    expect(questionOnDatabase).toBeTruthy()
  })
})
