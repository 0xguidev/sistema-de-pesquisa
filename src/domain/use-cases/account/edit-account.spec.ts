import { AccountAlreadyExistsError } from '../error/account-already-exists.error'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { InMemoryAccountRepository } from 'test/repositories/in-memory-account-repository'
import { makeAccount } from 'test/factories/make-Account'
import { EditAccountUseCase } from './edit-account'
import { InvalidAccountDataError } from '../error/invalid-account-data.error'

describe('Edit account', () => {
  let inMemoryAccountRepository: InMemoryAccountRepository
  let fakeHasher: FakeHasher
  let sut: EditAccountUseCase

  beforeEach(() => {
    inMemoryAccountRepository = new InMemoryAccountRepository()
    fakeHasher = new FakeHasher()
    sut = new EditAccountUseCase(inMemoryAccountRepository, fakeHasher)
  })

  it('should be able to edit an account', async () => {
    const account = makeAccount({
      name: 'John Doe',
      email: 'john@example.com',
    })

    await inMemoryAccountRepository.create(account)

    const result = await sut.execute({
      accountId: account.id.toString(),
      name: 'John Updated',
      email: 'updated@example.com',
      password: 'new-password',
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(inMemoryAccountRepository.items[0].name).toBe('John Updated')
      expect(inMemoryAccountRepository.items[0].email).toBe(
        'updated@example.com',
      )
      expect(inMemoryAccountRepository.items[0].password).toBe(
        await fakeHasher.hash('new-password'),
      )
    }
  })

  it('should not be able to edit an account when the email is already in use', async () => {
    const account = makeAccount({
      name: 'John Doe',
      email: 'john@example.com',
    })

    const anotherAccount = makeAccount({
      name: 'Jane Doe',
      email: 'jane@example.com',
    })

    await inMemoryAccountRepository.create(account)
    await inMemoryAccountRepository.create(anotherAccount)

    const result = await sut.execute({
      accountId: account.id.toString(),
      email: 'jane@example.com',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(AccountAlreadyExistsError)
  })

  it('should normalize email and name when editing an account', async () => {
    const account = makeAccount({ email: 'john@example.com' })
    await inMemoryAccountRepository.create(account)

    const result = await sut.execute({
      accountId: account.id.toString(),
      name: '  John Updated  ',
      email: '  JOHN.UPDATED@EXAMPLE.COM  ',
    })

    expect(result.isRight()).toBe(true)
    expect(account.name).toBe('John Updated')
    expect(account.email).toBe('john.updated@example.com')
  })

  it('should detect an existing email after normalization', async () => {
    const account = makeAccount({ email: 'john@example.com' })
    const anotherAccount = makeAccount({ email: 'jane@example.com' })
    await inMemoryAccountRepository.create(account)
    await inMemoryAccountRepository.create(anotherAccount)

    const result = await sut.execute({
      accountId: account.id.toString(),
      email: '  JANE@EXAMPLE.COM  ',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(AccountAlreadyExistsError)
  })

  it('should reject an invalid password and an empty name', async () => {
    const account = makeAccount()
    await inMemoryAccountRepository.create(account)

    const invalidPassword = await sut.execute({
      accountId: account.id.toString(),
      password: 'short',
    })
    const emptyName = await sut.execute({
      accountId: account.id.toString(),
      name: '   ',
    })

    expect(invalidPassword.value).toBeInstanceOf(InvalidAccountDataError)
    expect(emptyName.value).toBeInstanceOf(InvalidAccountDataError)
  })
})
