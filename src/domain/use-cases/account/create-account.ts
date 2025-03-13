import { Either, left, right } from 'src/core/types/either'
import { AccountAlreadyExistsError } from '../error/account-already-exists.error'
import { Injectable } from '@nestjs/common'
import { AccountRepository } from 'src/domain/repositories/account-repository'
import { Account } from 'src/domain/entities/account'
import { HashGenerator } from '@/domain/cryptography/hash-generator'

interface RegisterAccountUseCaseRequest {
  name: string
  email: string
  password: string
}

type RegisterAccountUseCaseResponse = Either<
  AccountAlreadyExistsError,
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
    const userWithSameEmail = await this.accountRepository.findByEmail(email)

    if (userWithSameEmail) {
      return left(new AccountAlreadyExistsError(email))
    }

    const hashedPassword = await this.hashGenerator.hash(password)

    const account = Account.create({
      name,
      email,
      password: hashedPassword,
    })

    await this.accountRepository.create(account)

    return right({
      account,
    })
  }
}
