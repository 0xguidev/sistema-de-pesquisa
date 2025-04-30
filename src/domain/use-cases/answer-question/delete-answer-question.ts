import { Injectable } from '@nestjs/common'
import { NotAllowedError } from 'src/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from 'src/core/errors/errors/resource-not-found-error'
import { Either, left, right } from 'src/core/types/either'
import { AnswerQuestionRepository } from 'src/domain/repositories/answer-question-repository'

interface DeleteAnswerQuestionUseCaseRequest {
  answerQuestionId: string
  accountId: string
}

type DeleteAnswerQuestionUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  null
>

@Injectable()
export class DeleteAnswerQuestionUseCase {
  constructor(private answerquestionsRepository: AnswerQuestionRepository) {}

  async execute({
    answerQuestionId,
    accountId,
  }: DeleteAnswerQuestionUseCaseRequest): Promise<DeleteAnswerQuestionUseCaseResponse> {
    const answerQuestion =
      await this.answerquestionsRepository.findById(answerQuestionId)

    if (answerQuestion?.accountId.toString() !== accountId) {
      return left(new NotAllowedError())
    }

    if (!answerQuestion) {
      return left(new ResourceNotFoundError())
    }

    await this.answerquestionsRepository.delete(answerQuestion.id.toString())

    return right(null)
  }
}
