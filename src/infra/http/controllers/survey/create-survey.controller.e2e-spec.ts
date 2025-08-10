import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'

describe('Create survey (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let accountFactory: AccountFactory

  beforeAll(async () => {
    const modularRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory],
    }).compile()

    app = modularRef.createNestApplication()
    prisma = modularRef.get(PrismaService)
    jwt = modularRef.get(JwtService)
    accountFactory = modularRef.get(AccountFactory)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('[POST] /surveys', async () => {
    const user = await accountFactory.makePrismaAccount()

    const accessToken = jwt.sign({ sub: user.id.toString() })

    // Payload com perguntas válidas para passar validação Zod
    const payload = {
      title: 'New survey',
      location: 'survey location',
      type: 'survey',
      questions: [
        {
          questionTitle: 'First question',
          questionNum: 1,
          answers: [
            { optionTitle: 'Option 1', optionNum: 1 },
            { optionTitle: 'Option 2', optionNum: 2 },
          ],
        },
      ],
    }

    const response = await request(app.getHttpServer())
      .post('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)

    expect(response.statusCode).toBe(201)

    const surveyOnDatabase = await prisma.survey.findFirst({
      where: {
        title: 'New survey',
      },
    })

    expect(surveyOnDatabase).toBeTruthy()
  })
})
