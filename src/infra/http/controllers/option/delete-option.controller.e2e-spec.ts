import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'
import { SurveyFactory } from 'test/factories/make-survey'
import { OptionAnswerFactory } from 'test/factories/make-option-answer'
import { QuestionFactory } from 'test/factories/make-question'

describe('Delete optionanswer (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let optionanswerFactory: OptionAnswerFactory
  let accountFactory: AccountFactory
  let surveyFactory: SurveyFactory
  let questionFactory: QuestionFactory

  beforeAll(async () => {
    const modularRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        AccountFactory,
        OptionAnswerFactory,
        SurveyFactory,
        QuestionFactory,
      ],
    }).compile()

    app = modularRef.createNestApplication()
    prisma = modularRef.get(PrismaService)
    jwt = modularRef.get(JwtService)
    optionanswerFactory = modularRef.get(OptionAnswerFactory)
    accountFactory = modularRef.get(AccountFactory)
    surveyFactory = modularRef.get(SurveyFactory)
    questionFactory = modularRef.get(QuestionFactory)

    await app.init()
  })

  test('[DELETE] /option-answers/:id', async () => {
    const user = await accountFactory.makePrismaAccount()

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })

    const question = await questionFactory.makePrismaQuestion({
      accountId: user.id,
      surveyId: survey.id,
    })

    const optionanswer = await optionanswerFactory.makePrismaOptionAnswer({
      accountId: user.id,
      questionId: question.id,
    })

    const optionAnswerId = optionanswer.id.toString()

    const isOptionAnswerExists = await prisma.optionAnswer.findUnique({
      where: {
        id: optionAnswerId,
      },
    })

    expect(isOptionAnswerExists).toBeTruthy()

    const response = await request(app.getHttpServer())
      .delete(`/option-answers/${optionAnswerId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(204)

    const optionAnswerOnDatabase = await prisma.optionAnswer.findUnique({
      where: {
        id: optionAnswerId,
      },
    })

    expect(optionAnswerOnDatabase).toBeNull()
  })
})
