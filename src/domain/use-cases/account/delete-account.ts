import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/types/either'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { AccountRepository } from '@/domain/repositories/account-repository'

interface DeleteAccountUseCaseRequest {
  accountId: string
}

type DeleteAccountUseCaseResponse = Either<ResourceNotFoundError, null>

@Injectable()
export class DeleteAccountUseCase {
  constructor(private accountRepository: AccountRepository) {}

  async execute({
    accountId,
  }: DeleteAccountUseCaseRequest): Promise<DeleteAccountUseCaseResponse> {
    const account = await this.accountRepository.findById(accountId)

    if (!account) {
      return left(new ResourceNotFoundError())
    }

    // The revocation row intentionally survives deletion as a security tombstone.
    await this.accountRepository.deleteAndRevokeTokens(accountId, new Date())

    return right(null)
  }
}
