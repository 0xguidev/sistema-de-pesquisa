import { FakeHasher } from 'test/cryptography/fake-hasher'
import { InMemoryAccountRepository } from 'test/repositories/in-memory-account-repository'
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
