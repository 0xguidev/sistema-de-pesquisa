import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { DatabaseModule } from '@/infra/database/database.module'
import { AccountFactory } from 'test/factories/make-Account'
import { AppModule } from '@/app.module'

describe('Create survey (E2E)', () => {
  let app: INestApplication
  let jwt: JwtService
  let accountFactory: AccountFactory

  beforeAll(async () => {
    const modularRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory],
    }).compile()

    app = modularRef.createNestApplication()
    jwt = modularRef.get(JwtService)
    accountFactory = modularRef.get(AccountFactory)

    await app.init()
  })
  test('[GET] /surveys', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    for (let i = 0; i < 15; i++) {
      await request(app.getHttpServer())
        .post('/surveys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: `Survey ${i}`,
          location: 'Survey location',
          type: 'Survey type',
          questions: [],
        })
    }

    const response = await request(app.getHttpServer())
      .get('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ page: 1 })

    expect(response.statusCode).toBe(200)
    expect(response.body.length).toBe(10)

    const responsePage2 = await request(app.getHttpServer())
      .get('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ page: 2 })

    expect(responsePage2.statusCode).toBe(200)
    expect(responsePage2.body.length).toBe(5)
  })

  test('[GET] /surveys - should return empty list if there are no surveys', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .get('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ page: 1 })

    expect(response.statusCode).toBe(200)
    expect(response.body.length).toBe(0)
  })

  test('[GET] /surveys - should return 400 if page is not a number', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .get('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ page: 'invalid' })

    expect(response.statusCode).toBe(400)
  })

  test('[GET] /surveys - should return 400 if page is less than 1', async () => {
    const user = await accountFactory.makePrismaAccount()
    const accessToken = jwt.sign({ sub: user.id.toString() })

    const response = await request(app.getHttpServer())
      .get('/surveys')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ page: 0 })

    expect(response.statusCode).toBe(400)
  })
})
