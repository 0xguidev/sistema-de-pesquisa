import { Either, right, left } from '@/core/types/either'
import { OptionAnswer } from '@/domain/entities/option-answer'
import { OptionAnswerRepository } from '@/domain/repositories/option-answer-repository'
import { Injectable } from '@nestjs/common'

interface GetOptionAnswerUseCaseRequest {
  optionId: string
  accountId: string
}

type GetOptionAnswerUseCaseResponse = Either<
  Error,
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
      return left(new Error('OptionAnswer not found'))
    }

    return right({
      optionanswer,
    })
  }
}
