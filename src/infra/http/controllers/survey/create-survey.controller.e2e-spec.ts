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

  test('[POST] /surveys - should create survey with questions and options', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .post('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Pesquisa Eleitoral 2025',
        location: 'Santa Catarina',
        type: 'Opinião Pública',
        questions: [
          {
            questionTitle: 'Qual sua avaliação do governo federal?',
            questionNum: 1,
            options: [
              { optionTitle: 'Ótimo', optionNum: 1 },
              { optionTitle: 'Bom', optionNum: 2 },
              { optionTitle: 'Regular', optionNum: 3 },
              { optionTitle: 'Ruim', optionNum: 4 },
              { optionTitle: 'Péssimo', optionNum: 5 },
            ],
          },
          {
            questionTitle: 'Qual sua avaliação do governo estadual?',
            questionNum: 2,
            options: [
              { optionTitle: 'Ótimo', optionNum: 1 },
              { optionTitle: 'Bom', optionNum: 2 },
              { optionTitle: 'Regular', optionNum: 3 },
              { optionTitle: 'Ruim', optionNum: 4 },
              { optionTitle: 'Péssimo', optionNum: 5 },
            ],
          },
        ],
      })

    expect(response.statusCode).toBe(201)

    const survey = await prisma.survey.findFirst({
      where: { title: 'Pesquisa Eleitoral 2025' },
    })

    expect(survey).toBeTruthy()

    const questions = await prisma.question.findMany({
      where: { surveyId: survey?.id },
    })

    expect(questions.length).toBe(2)

    const options = await prisma.optionAnswer.findMany({
      where: { questionId: questions[0].id },
    })

    expect(options.length).toBe(5)
  })
})
