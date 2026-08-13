import { Either, right, left } from '@/core/types/either'
import { AnswerQuestion } from '@/domain/entities/answer-question'
import { AnswerQuestionRepository } from '@/domain/repositories/answer-question-repository'
import { Injectable } from '@nestjs/common'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

interface GetAnswerQuestionUseCaseRequest {
  answerQuestionId: string
  accountId: string
}

type GetAnswerQuestionUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    answerQuestion: AnswerQuestion
  }
>

@Injectable()
export class GetAnswerQuestionUseCase {
  constructor(private answerQuestionRepository: AnswerQuestionRepository) {}

  async execute({
    answerQuestionId,
    accountId,
  }: GetAnswerQuestionUseCaseRequest): Promise<GetAnswerQuestionUseCaseResponse> {
    const answerQuestion =
      await this.answerQuestionRepository.findById(answerQuestionId)

    if (!answerQuestion) {
      return left(new ResourceNotFoundError())
    }

    if (answerQuestion.accountId.toString() !== accountId) {
      return left(new NotAllowedError())
    }

    return right({
      answerQuestion,
    })
  }
}
