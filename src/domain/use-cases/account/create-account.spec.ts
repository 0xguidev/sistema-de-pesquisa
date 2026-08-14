import { FakeHasher } from 'test/cryptography/fake-hasher'
import { InMemoryAccountRepository } from 'test/repositories/in-memory-account-repository'
import { AccountAlreadyExistsError } from '../error/account-already-exists.error'
import { RegisterAccountUseCase } from './create-account'

let inMemoryAccountRepository: InMemoryAccountRepository
let fakeHasher: FakeHasher

let sut: RegisterAccountUseCase

describe('Create acoount', () => {
  beforeEach(() => {
    inMemoryAccountRepository = new InMemoryAccountRepository()
    fakeHasher = new FakeHasher()

    sut = new RegisterAccountUseCase(inMemoryAccountRepository, fakeHasher)
  })

  it('should be able to register a new student', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: '123456',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      account: inMemoryAccountRepository.items[0],
    })
  })

  it('should normalize email before creating the account', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      email: '  JOHN@EXAMPLE.COM  ',
      password: '123456',
    })

    expect(result.isRight()).toBe(true)
    if (result.isLeft()) {
      throw new Error('Expected registration to succeed')
    }

    expect(result.value.account.email).toBe('john@example.com')
    expect(inMemoryAccountRepository.items[0].email).toBe('john@example.com')
  })

  it('should detect duplicate email with different case', async () => {
    await sut.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: '123456',
    })

    const result = await sut.execute({
      name: 'Jane Doe',
      email: 'JOHN@EXAMPLE.COM',
      password: '654321',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isRight()) {
      throw new Error('Expected duplicate email error')
    }

    expect(result.value).toBeInstanceOf(AccountAlreadyExistsError)
  })

  it('should hash student password upon registration', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: '123456',
    })

    const hashedPassword = await fakeHasher.hash('123456')

    expect(result.isRight()).toBe(true)
    expect(inMemoryAccountRepository.items[0].password).toEqual(hashedPassword)
  })
})
