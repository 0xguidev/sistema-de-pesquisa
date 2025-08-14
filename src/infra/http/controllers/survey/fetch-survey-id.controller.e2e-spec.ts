import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'
import { SurveyFactory } from 'test/factories/make-survey'

describe('Fetch survey by ID (E2E)', () => {
  let app: INestApplication
  let jwt: JwtService
  let accountFactory: AccountFactory
  let surveyFactory: SurveyFactory

  beforeAll(async () => {
    const modularRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory, SurveyFactory],
    }).compile()

    app = modularRef.createNestApplication()
    jwt = modularRef.get(JwtService)
    accountFactory = modularRef.get(AccountFactory)
    surveyFactory = modularRef.get(SurveyFactory)

    await app.init()
  })

  test('[GET] /surveys/:id', async () => {
    const user = await accountFactory.makePrismaAccount()

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const survey = await surveyFactory.makePrismaSurvey({
      accountId: user.id,
    })

    const surveyId = survey.id.toString()

    const response = await request(app.getHttpServer())
      .get(`/surveys/${surveyId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
  })

  test('[GET] /surveys/:id - should return 400 if survey does not exist', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .get('/surveys/invalid-id')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(400)
  })
})
