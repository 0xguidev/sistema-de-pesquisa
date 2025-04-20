import { NotAllowedError } from 'src/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from 'src/core/errors/errors/resource-not-found-error'
import { Either, left, right } from 'src/core/types/either'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { AnswerQuestion } from 'src/domain/entities/answer-question'
import { AnswerQuestionRepository } from 'src/domain/repositories/answer-question-repository'

interface EditAnswerQuestionUseCaseRequest {
  id: UniqueEntityID
  questionId: UniqueEntityID
  optionAnswerId: UniqueEntityID
  interviewId: UniqueEntityID
}

type EditAnswerQuestionUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    answerquestion: AnswerQuestion
  }
>

export class EditAnswerQuestionUseCase {
  constructor(private answerquestionsRepository: AnswerQuestionRepository) {}

  async execute({
    id,
    questionId,
    optionAnswerId,
    interviewId,
  }: EditAnswerQuestionUseCaseRequest): Promise<EditAnswerQuestionUseCaseResponse> {
    const answerquestion = await this.answerquestionsRepository.findById(id)

    if (!answerquestion) {
      return left(new ResourceNotFoundError())
    }
    answerquestion.interviewId = interviewId
    answerquestion.optionAnswerId = optionAnswerId
    answerquestion.questionId = questionId

    await this.answerquestionsRepository.update(answerquestion)

    return right({
      answerquestion,
    })
  }
}
