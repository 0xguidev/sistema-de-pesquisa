import { AppModule } from '@/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AccountFactory } from 'test/factories/make-Account'

describe('Create option answer (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let accountFactory: AccountFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    accountFactory = moduleRef.get(AccountFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[POST] /option-answers', async () => {
    const user = await accountFactory.makePrismaAccount()

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .post('/option-answers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        optionTitle: 'new option',
        optionNum: 1,
        questionId: '1',
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
