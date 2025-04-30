import { Either, right, left } from 'src/core/types/either'
import { OptionAnswer } from 'src/domain/entities/option-answer'
import { OptionAnswerRepository } from 'src/domain/repositories/option-answer-repository'

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
