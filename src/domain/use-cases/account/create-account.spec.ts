import { FakeHasher } from 'test/cryptography/fake-hasher'
import { InMemoryAccountRepository } from 'test/repositories/in-memory-account-repository'
import { AccountAlreadyExistsError } from '../error/account-already-exists.error'
import { RegisterAccountUseCase } from './create-account'
import { InvalidAccountDataError } from '../error/invalid-account-data.error'
import { unwrapLeft, unwrapRight } from 'test/utils/either'

let inMemoryAccountRepository: InMemoryAccountRepository
let fakeHasher: FakeHasher

let sut: RegisterAccountUseCase

describe('Create account', () => {
  beforeEach(() => {
    inMemoryAccountRepository = new InMemoryAccountRepository()
    fakeHasher = new FakeHasher()

    sut = new RegisterAccountUseCase(inMemoryAccountRepository, fakeHasher)
  })

  it('should register a new account', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: 'valid-password',
    })

    expect(unwrapRight(result)).toEqual({
      account: inMemoryAccountRepository.items[0],
    })
  })

  it('should normalize email before creating the account', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      email: '  JOHN@EXAMPLE.COM  ',
      password: 'valid-password',
    })

    expect(unwrapRight(result).account.email).toBe('john@example.com')
    expect(inMemoryAccountRepository.items[0].email).toBe('john@example.com')
  })

  it('should detect duplicate email with different case', async () => {
    await sut.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'valid-password',
    })

    const result = await sut.execute({
      name: 'Jane Doe',
      email: 'JOHN@EXAMPLE.COM',
      password: 'another-valid-password',
    })

    expect(unwrapLeft(result)).toBeInstanceOf(AccountAlreadyExistsError)
  })

  it('should hash student password upon registration', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: 'valid-password',
    })

    const hashedPassword = await fakeHasher.hash('valid-password')

    expect(result.isRight()).toBe(true)
    expect(inMemoryAccountRepository.items[0].password).toEqual(hashedPassword)
  })

  it('should reject an invalid password', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'short',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidAccountDataError)
    expect(inMemoryAccountRepository.items).toHaveLength(0)
  })

  it('should reject an empty name', async () => {
    const result = await sut.execute({
      name: '   ',
      email: 'john@example.com',
      password: 'valid-password',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidAccountDataError)
  })
})
