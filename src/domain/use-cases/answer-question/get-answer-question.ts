import { Either, right, left } from '@/core/types/either'
import { AnswerQuestion } from '@/domain/entities/answer-question'
import { AnswerQuestionRepository } from '@/domain/repositories/answer-question-repository'

interface GetAnswerQuestionUseCaseRequest {
  answerQuestionId: string
}

type GetAnswerQuestionUseCaseResponse = Either<
  Error,
  {
    answerQuestion: AnswerQuestion
  }
>

export class GetAnswerQuestionUseCase {
  constructor(private answerQuestionRepository: AnswerQuestionRepository) {}

  async execute({
    answerQuestionId,
  }: GetAnswerQuestionUseCaseRequest): Promise<GetAnswerQuestionUseCaseResponse> {
    const answerQuestion =
      await this.answerQuestionRepository.findById(answerQuestionId)

    if (!answerQuestion) {
      return left(new Error('AnswerQuestion not found'))
    }

    return right({
      answerQuestion,
    })
  }
}
