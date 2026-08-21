import { Either, right, left } from '@/core/types/either'
import { OptionAnswer } from '@/domain/entities/option-answer'
import { OptionAnswerRepository } from '@/domain/repositories/option-answer-repository'
import { Injectable } from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

interface GetOptionAnswerUseCaseRequest {
  optionId: string
  accountId: string
}

type GetOptionAnswerUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    optionanswer: OptionAnswer
  }
>

@Injectable()
export class GetOptionAnswerUseCase {
  constructor(private optionanswerRepository: OptionAnswerRepository) {}

  async execute({
    optionId,
    accountId,
  }: GetOptionAnswerUseCaseRequest): Promise<GetOptionAnswerUseCaseResponse> {
    const optionanswer = await this.optionanswerRepository.findById(
      optionId,
      accountId,
    )

    if (!optionanswer) {
      return left(new ResourceNotFoundError())
    }

    return right({
      optionanswer,
    })
  }
}
