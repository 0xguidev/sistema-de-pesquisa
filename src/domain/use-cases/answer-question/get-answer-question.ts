import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Either, right, left } from 'src/core/types/either'
import { AnswerQuestion } from 'src/domain/entities/answer-question'
import { AnswerQuestionRepository } from 'src/domain/repositories/answer-question-repository'

interface GetAnswerQuestionUseCaseRequest {
  answerQuestionId: UniqueEntityID
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
