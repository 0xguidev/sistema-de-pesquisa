import { Either, left, right } from '@/core/types/either'
import { AccountAlreadyExistsError } from '../error/account-already-exists.error'
import { Injectable } from '@nestjs/common'
import { AccountRepository } from '@/domain/repositories/account-repository'
import { Account } from '@/domain/entities/account'
import { HashGenerator } from '@/domain/cryptography/hash-generator'
import {
  isAccountEmailValid,
  isAccountNameValid,
  isAccountPasswordValid,
  normalizeAccountEmail,
  normalizeAccountName,
} from '@/domain/account/account-policy'
import { InvalidAccountDataError } from '../error/invalid-account-data.error'

interface RegisterAccountUseCaseRequest {
  name: string
  email: string
  password: string
}

type RegisterAccountUseCaseResponse = Either<
  AccountAlreadyExistsError | InvalidAccountDataError,
  {
    account: Account
  }
>

@Injectable()
export class RegisterAccountUseCase {
  constructor(
    private accountRepository: AccountRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    name,
    email,
    password,
  }: RegisterAccountUseCaseRequest): Promise<RegisterAccountUseCaseResponse> {
    const normalizedName = normalizeAccountName(name)
    const normalizedEmail = normalizeAccountEmail(email)

    if (!isAccountNameValid(normalizedName)) {
      return left(new InvalidAccountDataError('Invalid account name'))
    }

    if (!isAccountEmailValid(normalizedEmail)) {
      return left(new InvalidAccountDataError('Invalid account email'))
    }

    if (!isAccountPasswordValid(password)) {
      return left(new InvalidAccountDataError('Invalid account password'))
    }

    const userWithSameEmail =
      await this.accountRepository.findByEmail(normalizedEmail)

    if (userWithSameEmail) {
      return left(new AccountAlreadyExistsError(normalizedEmail))
    }

    const hashedPassword = await this.hashGenerator.hash(password)

    const account = Account.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
    })

    await this.accountRepository.create(account)

    return right({
      account,
    })
  }
}
