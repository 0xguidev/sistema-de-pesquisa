import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Either, right } from 'src/core/types/either'
import { OptionAnswerRepository } from '../../repositories/option-answer-repository'
import { OptionAnswer } from '../../entities/option-answer'

interface CreateOptionAnswerUseCaseRequest {
  answerTitle: string
  answerNum: number
  questionId: UniqueEntityID
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
    answerTitle,
    answerNum,
    questionId,
  }: CreateOptionAnswerUseCaseRequest): Promise<CreateOptionAnswerUseCaseResponse> {
    const optionAnswer = OptionAnswer.create({
      answerTitle,
      answerNum,
      questionId,
    })

    await this.optionanswerRepository.create(optionAnswer)

    return right({
      optionAnswer,
    })
  }
}
