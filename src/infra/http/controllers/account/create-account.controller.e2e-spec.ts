import { INestApplication } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { Test } from '@nestjs/testing'
import { AppModule } from '@/app.module'
import request from 'supertest'

describe('Create Account (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)

    await app.init()
  })

  afterEach(async () => {
    await app.close()
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

    expect(userOnDatabase).toMatchObject({
      name: 'John Doe',
      email: 'johndoe@example.com',
      role: 'USER',
    })
    expect(response.body).not.toHaveProperty('password')
    expect(response.body).not.toHaveProperty('hash')
  })

  test('ignores a client attempt to self-assign the ADMIN role', async () => {
    const email = 'role-escalation@example.com'
    await request(app.getHttpServer())
      .post('/accounts')
      .send({
        name: 'Regular User',
        email,
        password: 'valid-password',
        role: 'ADMIN',
      })
      .expect(201)

    const account = await prisma.user.findUnique({ where: { email } })
    expect(account?.role).toBe('USER')
  })

  test('does not reveal whether an account email already exists', async () => {
    const originalBody = {
      name: 'Original Account',
      email: 'existing@example.com',
      password: 'original-password',
    }

    const created = await request(app.getHttpServer())
      .post('/accounts')
      .send(originalBody)
    const original = await prisma.user.findUniqueOrThrow({
      where: { email: originalBody.email },
    })
    const sessionsBefore = await prisma.session.count({
      where: { accountId: original.id },
    })
    const duplicate = await request(app.getHttpServer())
      .post('/accounts')
      .send({
        name: 'Attacker Controlled Name',
        email: '  EXISTING@EXAMPLE.COM  ',
        password: 'attacker-password',
        role: 'ADMIN',
      })

    expect(created.statusCode).toBe(201)
    expect(duplicate.statusCode).toBe(created.statusCode)
    expect(duplicate.body).toEqual(created.body)

    const accounts = await prisma.user.findMany({
      where: { email: originalBody.email },
    })
    expect(accounts).toHaveLength(1)
    expect(accounts[0]).toEqual(original)
    expect(accounts[0]).toMatchObject({
      name: 'Original Account',
      email: 'existing@example.com',
      password: original.password,
      role: 'USER',
      slug: original.slug,
    })
    expect(accounts[0].password).not.toBe('attacker-password')
    expect(
      await prisma.session.count({ where: { accountId: original.id } }),
    ).toBe(sessionsBefore)
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
