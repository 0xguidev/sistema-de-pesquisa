import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Either, right } from 'src/core/types/either'
import { OptionAnswerRepository } from '../../repositories/option-answer-repository'
import { OptionAnswer } from '../../entities/option-answer'

interface CreateOptionAnswerUseCaseRequest {
  optionTitle: string
  optionNum: number
  accountId: string
  questionId: string
}

type CreateOptionAnswerUseCaseResponse = Either<
  null,
  {
    optionAnswer: OptionAnswer
  }
>

export class CreateOptionAnswerUseCase {
  constructor(private optionanswerRepository: OptionAnswerRepository) {}

  async execute({
    optionTitle,
    optionNum,
    accountId,
    questionId,
  }: CreateOptionAnswerUseCaseRequest): Promise<CreateOptionAnswerUseCaseResponse> {
    const optionAnswer = OptionAnswer.create({
      optionTitle,
      optionNum,
      accountId: new UniqueEntityID(accountId),
      questionId: new UniqueEntityID(questionId),
    })

    await this.optionanswerRepository.create(optionAnswer)

    return right({
      optionAnswer,
    })
  }
}
