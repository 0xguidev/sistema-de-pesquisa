import { Either, left, right } from '@/core/types/either'
import { Injectable } from '@nestjs/common'
import { WrongCredentialsError } from '../error/wrong-credentials-error'
import { AccountRepository } from '@/domain/repositories/account-repository'
import { HashComparer } from '@/domain/cryptography/hash-comparer'
import { Encrypter } from '@/domain/cryptography/encrypter'

interface AuthenticateStudentUseCaseRequest {
  email: string
  password: string
}

type AuthenticateStudentUseCaseResponse = Either<
  WrongCredentialsError,
  {
    accessToken: string
  }
>

@Injectable()
export class AuthenticateAccountUseCase {
  constructor(
    private accountRepository: AccountRepository,
    private hashComparer: HashComparer,
    private encrypter: Encrypter,
  ) {}

  async execute({
    email,
    password,
  }: AuthenticateStudentUseCaseRequest): Promise<AuthenticateStudentUseCaseResponse> {
    const student = await this.accountRepository.findByEmail(email)

    if (!student) {
      return left(new WrongCredentialsError())
    }

    const isPasswordValid = await this.hashComparer.compare(
      password,
      student.password,
    )

    if (!isPasswordValid) {
      return left(new WrongCredentialsError())
    }

    const accessToken = await this.encrypter.encrypt({
      sub: student.id.toString(),
    })

    return right({
      accessToken,
    })
  }
}
