import { INestApplication } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { Test } from '@nestjs/testing'
import { AppModule } from '@/app.module'
import request from 'supertest'

describe('Create Account (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)

    await app.init()
  })

  test('[POST] /accounts', async () => {
    const response = await request(app.getHttpServer()).post('/accounts').send({
      name: 'John Doe',
      email: '  JOHNDOE@EXAMPLE.COM  ',
      password: 'valid-password',
    })

    expect(response.statusCode).toBe(201)

    const userOnDatabase = await prisma.user.findUnique({
      where: {
        email: 'johndoe@example.com',
      },
    })

    expect(userOnDatabase).toBeTruthy()
    expect(userOnDatabase?.role).toBe('USER')
    expect(response.body).not.toHaveProperty('password')
    expect(response.body).not.toHaveProperty('hash')
  })

  test('ignores a client attempt to self-assign the ADMIN role', async () => {
    const email = 'role-escalation@example.com'
    await request(app.getHttpServer()).post('/accounts').send({
      name: 'Regular User',
      email,
      password: 'valid-password',
      role: 'ADMIN',
    }).expect(201)

    const account = await prisma.user.findUnique({ where: { email } })
    expect(account?.role).toBe('USER')
  })

  test('does not reveal whether an account email already exists', async () => {
    const body = {
      name: 'Existing Account',
      email: 'existing@example.com',
      password: 'valid-password',
    }

    const created = await request(app.getHttpServer())
      .post('/accounts')
      .send(body)
    const duplicate = await request(app.getHttpServer())
      .post('/accounts')
      .send({ ...body, name: 'Another Name' })

    expect(created.statusCode).toBe(201)
    expect(duplicate.statusCode).toBe(created.statusCode)
    expect(duplicate.body).toEqual(created.body)
  })

  test.each([
    [
      'short password',
      { name: 'John Doe', email: 'john@example.com', password: 'short' },
    ],
    [
      'empty name',
      { name: '   ', email: 'john@example.com', password: 'valid-password' },
    ],
  ])('rejects %s', async (_, body) => {
    const response = await request(app.getHttpServer())
      .post('/accounts')
      .send(body)

    expect(response.statusCode).toBe(400)
  })
})
