import { Injectable } from '@nestjs/common'
import { NotAllowedError } from 'src/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from 'src/core/errors/errors/resource-not-found-error'
import { Either, left, right } from 'src/core/types/either'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { AnswerQuestionRepository } from 'src/domain/repositories/answer-question-repository'

interface DeleteAnswerQuestionUseCaseRequest {
  answerQuestionId: UniqueEntityID
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
  }: DeleteAnswerQuestionUseCaseRequest): Promise<DeleteAnswerQuestionUseCaseResponse> {
    const answerQuestion =
      await this.answerquestionsRepository.findById(answerQuestionId)

    if (!answerQuestion) {
      return left(new ResourceNotFoundError())
    }

    await this.answerquestionsRepository.delete(answerQuestion.id)

    return right(null)
  }
}
