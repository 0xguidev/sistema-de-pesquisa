import { Either, left, right } from '@/core/types/either'
import { Injectable } from '@nestjs/common'
import { AccountRepository } from '@/domain/repositories/account-repository'
import { HashGenerator } from '@/domain/cryptography/hash-generator'
import { Account } from '@/domain/entities/account'
import { AccountAlreadyExistsError } from '../error/account-already-exists.error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import {
  isAccountEmailValid,
  isAccountNameValid,
  isAccountPasswordValid,
  normalizeAccountEmail,
  normalizeAccountName,
} from '@/domain/account/account-policy'
import { InvalidAccountDataError } from '../error/invalid-account-data.error'
import { PasswordCompromiseChecker } from '@/domain/account/password-compromise-checker'

interface EditAccountUseCaseRequest {
  accountId: string
  name?: string
  email?: string
  password?: string
}

type EditAccountUseCaseResponse = Either<
  | ResourceNotFoundError
  | NotAllowedError
  | AccountAlreadyExistsError
  | InvalidAccountDataError,
  {
    account: Account
  }
>

@Injectable()
export class EditAccountUseCase {
  constructor(
    private accountRepository: AccountRepository,
    private hashGenerator: HashGenerator,
    private passwordCompromiseChecker: PasswordCompromiseChecker,
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

    const normalizedName =
      name === undefined ? undefined : normalizeAccountName(name)
    const normalizedEmail =
      email === undefined ? undefined : normalizeAccountEmail(email)

    if (normalizedName !== undefined && !isAccountNameValid(normalizedName)) {
      return left(new InvalidAccountDataError('Invalid account name'))
    }

    if (
      normalizedEmail !== undefined &&
      !isAccountEmailValid(normalizedEmail)
    ) {
      return left(new InvalidAccountDataError('Invalid account email'))
    }

    if (password !== undefined && !isAccountPasswordValid(password)) {
      return left(new InvalidAccountDataError('Invalid account password'))
    }

    if (
      password !== undefined &&
      (await this.passwordCompromiseChecker.isCompromised(password))
    ) {
      return left(new InvalidAccountDataError('Invalid account password'))
    }

    if (normalizedEmail && normalizedEmail !== account.email) {
      const accountWithSameEmail =
        await this.accountRepository.findByEmail(normalizedEmail)

      if (
        accountWithSameEmail &&
        accountWithSameEmail.id.toString() !== accountId
      ) {
        return left(new AccountAlreadyExistsError(normalizedEmail))
      }
    }

    if (normalizedName !== undefined) {
      account.name = normalizedName
    }

    if (normalizedEmail) {
      account.email = normalizedEmail
    }

    if (password !== undefined) {
      account.password = await this.hashGenerator.hash(password)
    }

    if (password !== undefined) {
      await this.accountRepository.updateAndRevokeTokens(account, new Date())
    } else {
      // Changing email alone keeps existing sessions: JWT identity uses immutable sub.
      await this.accountRepository.update(account)
    }

    return right({
      account,
    })
  }
}
