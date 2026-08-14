import { FakeHasher } from 'test/cryptography/fake-hasher'
import { FakeEncrypter } from 'test/cryptography/fake-encrypter'
import { InMemoryAccountRepository } from 'test/repositories/in-memory-account-repository'
import { makeAccount } from 'test/factories/make-Account'
import { AuthenticateAccountUseCase } from './authenticate-account'

let inMemoryAccountRepository: InMemoryAccountRepository
let fakeHasher: FakeHasher
let encrypter: FakeEncrypter

let sut: AuthenticateAccountUseCase

describe('Authenticate Student', () => {
  beforeEach(() => {
    inMemoryAccountRepository = new InMemoryAccountRepository()
    fakeHasher = new FakeHasher()
    encrypter = new FakeEncrypter()

    sut = new AuthenticateAccountUseCase(
      inMemoryAccountRepository,
      fakeHasher,
      encrypter,
    )
  })

  it('should be able to authenticate a student', async () => {
    const student = makeAccount({
      email: 'johndoe@example.com',
      password: await fakeHasher.hash('123456'),
    })

    inMemoryAccountRepository.items.push(student)

    const result = await sut.execute({
      email: 'johndoe@example.com',
      password: '123456',
    })

    expect(result.isRight()).toBe(true)

    if (result.isLeft()) {
      throw new Error('Expected authentication to succeed')
    }

    expect(result.value).toEqual({
      accessToken: expect.any(String),
    })

    const payload = JSON.parse(result.value.accessToken)
    expect(payload).toMatchObject({
      sub: student.id.toString(),
      iss: 'sistema-de-pesquisa',
      aud: 'sistema-de-pesquisa',
    })
  })
})
