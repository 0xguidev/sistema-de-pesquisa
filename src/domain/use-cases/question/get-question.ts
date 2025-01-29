import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Question } from '../../entities/question'
import { QuestionRepository } from '../../repositories/question-repository'
import { Either, right, left } from 'src/core/types/either'

interface GetQuestionUseCaseRequest {
  questionId: UniqueEntityID
}

type GetQuestionUseCaseResponse = Either<
  Error,
  {
    question: Question
  }
>

export class GetQuestionUseCase {
  constructor(private questionRepository: QuestionRepository) {}

  async execute({
    questionId,
  }: GetQuestionUseCaseRequest): Promise<GetQuestionUseCaseResponse> {
    const question = await this.questionRepository.findById(questionId)

    if (!question) {
      return left(new Error('Question not found'))
    }

    return right({
      question,
    })
  }
}
