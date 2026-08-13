import { makeAccount } from 'test/factories/make-Account'
import { InMemoryAccountRepository } from 'test/repositories/in-memory-account-repository'
import { DeleteAccountUseCase } from './delete-account'

describe('Delete account', () => {
  let inMemoryAccountRepository: InMemoryAccountRepository
  let sut: DeleteAccountUseCase

  beforeEach(() => {
    inMemoryAccountRepository = new InMemoryAccountRepository()
    sut = new DeleteAccountUseCase(inMemoryAccountRepository)
  })

  it('should be able to delete an account', async () => {
    const account = makeAccount({
      name: 'John Doe',
      email: 'john@example.com',
    })

    await inMemoryAccountRepository.create(account)

    const result = await sut.execute({
      accountId: account.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryAccountRepository.items).toHaveLength(0)
  })

  it('should not be able to delete a non-existent account', async () => {
    const result = await sut.execute({
      accountId: 'non-existent-id',
    })

    expect(result.isLeft()).toBe(true)
  })
})
