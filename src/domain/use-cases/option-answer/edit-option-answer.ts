import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { NotAllowedError } from 'src/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from 'src/core/errors/errors/resource-not-found-error'
import { Either, left, right } from 'src/core/types/either'
import { OptionAnswer } from 'src/domain/entities/option-answer'
import { OptionAnswerRepository } from 'src/domain/repositories/option-answer-repository'

interface EditOptionAnswerUseCaseRequest {
  answerId: UniqueEntityID
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
  }: EditOptionAnswerUseCaseRequest): Promise<EditOptionAnswerUseCaseResponse> {
    const optionAnswer = await this.optionAnswersRepository.findById(answerId)

    if (!optionAnswer) {
      return left(new ResourceNotFoundError())
    }

    optionAnswer.answerTitle = 'new_title'
    optionAnswer.answerNum = 2

    await this.optionAnswersRepository.update(optionAnswer)

    return right({
      optionAnswer,
    })
  }
}
