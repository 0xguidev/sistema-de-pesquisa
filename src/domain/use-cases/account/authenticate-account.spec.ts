import { FakeHasher } from 'test/cryptography/fake-hasher'
import { InMemoryAccountRepository } from 'test/repositories/in-memory-account-repository'
import { makeAccount } from 'test/factories/make-Account'
import { AuthenticateAccountUseCase } from './authenticate-account'
import { unwrapRight } from 'test/utils/either'

let inMemoryAccountRepository: InMemoryAccountRepository
let fakeHasher: FakeHasher
let sut: AuthenticateAccountUseCase

describe('Authenticate account', () => {
  beforeEach(() => {
    inMemoryAccountRepository = new InMemoryAccountRepository()
    fakeHasher = new FakeHasher()
    sut = new AuthenticateAccountUseCase(
      inMemoryAccountRepository,
      fakeHasher,
      fakeHasher,
    )
  })

  it('should authenticate an account', async () => {
    const student = makeAccount({
      email: 'johndoe@example.com',
      password: await fakeHasher.hash('123456'),
    })

    inMemoryAccountRepository.items.push(student)

    const result = await sut.execute({
      email: 'johndoe@example.com',
      password: '123456',
    })

    expect(unwrapRight(result)).toEqual({
      accountId: student.id.toString(),
    })
  })

  it('should authenticate when email casing differs', async () => {
    const student = makeAccount({
      email: 'john@example.com',
      password: await fakeHasher.hash('123456'),
    })

    inMemoryAccountRepository.items.push(student)

    const result = await sut.execute({
      email: '  JOHN@EXAMPLE.COM  ',
      password: '123456',
    })

    expect(unwrapRight(result)).toEqual({
      accountId: student.id.toString(),
    })
  })

  it('should reject an incorrect password', async () => {
    const account = makeAccount({
      email: 'john@example.com',
      password: await fakeHasher.hash('correct-password'),
    })
    inMemoryAccountRepository.items.push(account)

    const result = await sut.execute({
      email: 'john@example.com',
      password: 'incorrect-password',
    })

    expect(result.isLeft()).toBe(true)
  })

  it('should opportunistically rehash a password after a successful login', async () => {
    const oldHash = '123456-old-hash'
    const account = makeAccount({
      email: 'john@example.com',
      password: oldHash,
    })
    inMemoryAccountRepository.items.push(account)
    fakeHasher.shouldRehash = true
    fakeHasher.compare = async (plain, hashed) =>
      plain === '123456' && hashed === oldHash

    const result = await sut.execute({
      email: 'john@example.com',
      password: '123456',
    })

    expect(result.isRight()).toBe(true)
    expect(account.password).toBe(await fakeHasher.hash('123456'))
    expect(account.password).not.toBe(oldHash)
  })
})
