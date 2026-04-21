import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Injectable } from '@nestjs/common'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { Either, left, right } from '@/core/types/either'
import { AnswerQuestion } from '@/domain/entities/answer-question'
import { AnswerQuestionRepository } from '@/domain/repositories/answer-question-repository'

interface EditAnswerQuestionUseCaseRequest {
  accountId: string
  answerQuestionId: string
  questionId?: string
  optionAnswerId?: string
}

type EditAnswerQuestionUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    answerquestion: AnswerQuestion
  }
>

@Injectable()
export class EditAnswerQuestionUseCase {
  constructor(private answerquestionsRepository: AnswerQuestionRepository) {}

  async execute({
    accountId,
    answerQuestionId,
    questionId,
    optionAnswerId,
  }: EditAnswerQuestionUseCaseRequest): Promise<EditAnswerQuestionUseCaseResponse> {
    const answerquestion =
      await this.answerquestionsRepository.findById(answerQuestionId)

    if (!answerquestion) {
      return left(new ResourceNotFoundError())
    }

    if (answerquestion.accountId.toString() !== accountId) {
      return left(new NotAllowedError())
    }

    answerquestion.optionAnswerId = optionAnswerId
      ? new UniqueEntityID(optionAnswerId)
      : answerquestion.optionAnswerId
    answerquestion.questionId = questionId
      ? new UniqueEntityID(questionId)
      : answerquestion.questionId

    await this.answerquestionsRepository.update(answerquestion)

    return right({
      answerquestion,
    })
  }
}
