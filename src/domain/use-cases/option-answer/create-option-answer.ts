import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Either, left, right } from '@/core/types/either'
import { OptionAnswerRepository } from '../../repositories/option-answer-repository'
import { OptionAnswer } from '../../entities/option-answer'
import { Injectable } from '@nestjs/common'
import { QuestionRepository } from '../../repositories/question-repository'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

interface CreateOptionAnswerUseCaseRequest {
  optionTitle: string
  optionNum: number
  accountId: string
  questionId: string
}

type CreateOptionAnswerUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    optionAnswer: OptionAnswer
  }
>

@Injectable()
export class CreateOptionAnswerUseCase {
  constructor(
    private optionanswerRepository: OptionAnswerRepository,
    private questionRepository: QuestionRepository,
  ) {}

  async execute({
    optionTitle,
    optionNum,
    accountId,
    questionId,
  }: CreateOptionAnswerUseCaseRequest): Promise<CreateOptionAnswerUseCaseResponse> {
    const question = await this.questionRepository.findByIdAndAccountId(
      questionId,
      accountId,
    )

    if (!question) {
      return left(new ResourceNotFoundError())
    }

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
