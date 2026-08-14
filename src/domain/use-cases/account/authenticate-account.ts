import { Either, left, right } from '@/core/types/either'
import { Injectable } from '@nestjs/common'
import { WrongCredentialsError } from '../error/wrong-credentials-error'
import { AccountRepository } from '@/domain/repositories/account-repository'
import { normalizeAccountEmail } from '@/domain/account/account-policy'
import { HashComparer } from '@/domain/cryptography/hash-comparer'
import { Encrypter } from '@/domain/cryptography/encrypter'
import { HashGenerator } from '@/domain/cryptography/hash-generator'

interface AuthenticateStudentUseCaseRequest {
  email: string
  password: string
}

type AuthenticateAccountUseCaseResponse = Either<
  WrongCredentialsError,
  {
    accessToken: string
    accountId: string
  }
>

@Injectable()
export class AuthenticateAccountUseCase {
  constructor(
    private accountRepository: AccountRepository,
    private hashComparer: HashComparer,
    private hashGenerator: HashGenerator,
    private encrypter: Encrypter,
  ) {}

  async execute({
    email,
    password,
  }: AuthenticateStudentUseCaseRequest): Promise<AuthenticateAccountUseCaseResponse> {
    const normalizedEmail = normalizeAccountEmail(email)
    const account = await this.accountRepository.findByEmail(normalizedEmail)
    if (!account) {
      return left(new WrongCredentialsError())
    }

    const isPasswordValid = await this.hashComparer.compare(
      password,
      account.password,
    )

    if (!isPasswordValid) {
      return left(new WrongCredentialsError())
    }

    if (this.hashComparer.needsRehash(account.password)) {
      account.password = await this.hashGenerator.hash(password)
      await this.accountRepository.update(account)
    }

    const accessToken = await this.encrypter.encrypt({
      sub: account.id.toString(),
    })
    return right({
      accessToken,
      accountId: account.id.toString(),
    })
  }
}
