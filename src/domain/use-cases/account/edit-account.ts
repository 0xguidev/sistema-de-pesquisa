import { Either, left, right } from '@/core/types/either'
import { Injectable } from '@nestjs/common'
import { AccountRepository } from '@/domain/repositories/account-repository'
import { HashGenerator } from '@/domain/cryptography/hash-generator'
import { Account } from '@/domain/entities/account'
import { AccountAlreadyExistsError } from '../error/account-already-exists.error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

interface EditAccountUseCaseRequest {
  accountId: string
  name?: string
  email?: string
  password?: string
}

type EditAccountUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError | AccountAlreadyExistsError,
  {
    account: Account
  }
>

@Injectable()
export class EditAccountUseCase {
  constructor(
    private accountRepository: AccountRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    accountId,
    name,
    email,
    password,
  }: EditAccountUseCaseRequest): Promise<EditAccountUseCaseResponse> {
    const account = await this.accountRepository.findById(accountId)

    if (!account) {
      return left(new ResourceNotFoundError())
    }

    if (email && email !== account.email) {
      const accountWithSameEmail =
        await this.accountRepository.findByEmail(email)

      if (
        accountWithSameEmail &&
        accountWithSameEmail.id.toString() !== accountId
      ) {
        return left(new AccountAlreadyExistsError(email))
      }
    }

    if (name) {
      account.name = name
    }

    if (email) {
      account.email = email
    }

    if (password) {
      account.password = await this.hashGenerator.hash(password)
    }

    await this.accountRepository.update(account)

    return right({
      account,
    })
  }
}
