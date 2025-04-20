import { NotAllowedError } from 'src/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from 'src/core/errors/errors/resource-not-found-error'
import { Either, left, right } from 'src/core/types/either'
import { Question } from '../../entities/question'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { QuestionRepository } from '../../repositories/question-repository'

interface EditQuestionUseCaseRequest {
  questionId: UniqueEntityID
  questionTitle: string
  questionNum: number
}

type EditQuestionUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    question: Question
  }
>

export class EditQuestionUseCase {
  constructor(private questionsRepository: QuestionRepository) {}

  async execute({
    questionId,
    questionTitle,
    questionNum,
  }: EditQuestionUseCaseRequest): Promise<EditQuestionUseCaseResponse> {
    const question = await this.questionsRepository.findById(questionId)

    if (!question) {
      return left(new ResourceNotFoundError())
    }
    question.questionTitle = questionTitle
    question.questionNum = questionNum

    await this.questionsRepository.update(question)

    return right({
      question,
    })
  }
}
