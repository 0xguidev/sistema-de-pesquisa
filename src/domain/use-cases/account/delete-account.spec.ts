import { makeAccount } from 'test/factories/make-Account'
import { InMemoryAccountRepository } from 'test/repositories/in-memory-account-repository'
import { DeleteAccountUseCase } from './delete-account'
import { InMemoryTokenRevocation } from 'test/auth/in-memory-token-revocation'

describe('Delete account', () => {
  let inMemoryAccountRepository: InMemoryAccountRepository
  let sut: DeleteAccountUseCase
  let tokenRevocation: InMemoryTokenRevocation

  beforeEach(() => {
    inMemoryAccountRepository = new InMemoryAccountRepository()
    tokenRevocation = new InMemoryTokenRevocation()
    sut = new DeleteAccountUseCase(
      inMemoryAccountRepository,
      tokenRevocation,
    )
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
    expect(
      await tokenRevocation.isAccountRevoked(account.id.toString()),
    ).toBe(true)
  })

  it('should not be able to delete a non-existent account', async () => {
    const result = await sut.execute({
      accountId: 'non-existent-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(tokenRevocation.revokedAccountIds.size).toBe(0)
  })
})
