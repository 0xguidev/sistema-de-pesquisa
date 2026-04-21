import { Either, right, left } from '@/core/types/either'
import { OptionAnswer } from '@/domain/entities/option-answer'
import { OptionAnswerRepository } from '@/domain/repositories/option-answer-repository'

interface GetOptionAnswerUseCaseRequest {
  optionanswerId: string
}

type GetOptionAnswerUseCaseResponse = Either<
  Error,
  {
    optionanswer: OptionAnswer
  }
>

export class GetOptionAnswerUseCase {
  constructor(private optionanswerRepository: OptionAnswerRepository) {}

  async execute({
    optionanswerId,
  }: GetOptionAnswerUseCaseRequest): Promise<GetOptionAnswerUseCaseResponse> {
    const optionanswer =
      await this.optionanswerRepository.findById(optionanswerId)

    if (!optionanswer) {
      return left(new Error('OptionAnswer not found'))
    }

    return right({
      optionanswer,
    })
  }
}
