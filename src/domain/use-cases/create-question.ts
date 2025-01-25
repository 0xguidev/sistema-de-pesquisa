import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Question } from '../entities/question'
import { QuestionRepository } from '../repositories/question-repository'
import { Either, right } from 'src/core/types/either'

interface CreateQuestionUseCaseRequest {
  questionTitle: string
  questionNum: number
  surveyId: UniqueEntityID
}

type CreateQuestionUseCaseResponse = Either<
  null,
  {
    question: Question
  }
>

export class CreateQuestion {
  constructor(private questionRepository: QuestionRepository) {}

  async execute({
    questionTitle,
    questionNum,
    surveyId,
  }: CreateQuestionUseCaseRequest): Promise<CreateQuestionUseCaseResponse> {
    const question = Question.create({
      questionTitle,
      questionNum,
      surveyId,
    })

    await this.questionRepository.create(question)

    return right({
      question,
    })
  }
}
