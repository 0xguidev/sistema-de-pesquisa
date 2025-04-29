import { NotAllowedError } from 'src/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from 'src/core/errors/errors/resource-not-found-error'
import { Either, left, right } from 'src/core/types/either'
import { OptionAnswer } from 'src/domain/entities/option-answer'
import { OptionAnswerRepository } from 'src/domain/repositories/option-answer-repository'

interface EditOptionAnswerUseCaseRequest {
  answerId: string
  answerTitle: string
  answerNum: number
}

type EditOptionAnswerUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    optionAnswer: OptionAnswer
  }
>

export class EditOptionAnswerUseCase {
  constructor(private optionAnswersRepository: OptionAnswerRepository) {}

  async execute({
    answerId,
    answerTitle,
    answerNum,
  }: EditOptionAnswerUseCaseRequest): Promise<EditOptionAnswerUseCaseResponse> {
    const optionAnswer = await this.optionAnswersRepository.findById(answerId)

    if (!optionAnswer) {
      return left(new ResourceNotFoundError())
    }

    optionAnswer.optionTitle = answerTitle
    optionAnswer.optionNum = answerNum

    await this.optionAnswersRepository.save(optionAnswer)

    return right({
      optionAnswer,
    })
  }
}
