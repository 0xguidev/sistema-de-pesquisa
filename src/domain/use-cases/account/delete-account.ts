import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/types/either'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { AccountRepository } from '@/domain/repositories/account-repository'
import { TokenRevocation } from '@/domain/auth/token-revocation'

interface DeleteAccountUseCaseRequest {
  accountId: string
}

type DeleteAccountUseCaseResponse = Either<ResourceNotFoundError, null>

@Injectable()
export class DeleteAccountUseCase {
  constructor(
    private accountRepository: AccountRepository,
    private tokenRevocation: TokenRevocation,
  ) {}

  async execute({
    accountId,
  }: DeleteAccountUseCaseRequest): Promise<DeleteAccountUseCaseResponse> {
    const account = await this.accountRepository.findById(accountId)

    if (!account) {
      return left(new ResourceNotFoundError())
    }

    await this.accountRepository.delete(accountId)
    await this.tokenRevocation.revokeAllForAccount(accountId)

    return right(null)
  }
}
