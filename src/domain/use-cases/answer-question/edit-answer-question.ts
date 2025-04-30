import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from 'src/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from 'src/core/errors/errors/resource-not-found-error'
import { Either, left, right } from 'src/core/types/either'
import { AnswerQuestion } from 'src/domain/entities/answer-question'
import { AnswerQuestionRepository } from 'src/domain/repositories/answer-question-repository'

interface EditAnswerQuestionUseCaseRequest {
  id: string
  optionAnswerId: string
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
    optionAnswerId,
  }: EditAnswerQuestionUseCaseRequest): Promise<EditAnswerQuestionUseCaseResponse> {
    const answerquestion = await this.answerquestionsRepository.findById(id)

    if (!answerquestion) {
      return left(new ResourceNotFoundError())
    }

    answerquestion.optionAnswerId = new UniqueEntityID(optionAnswerId)

    await this.answerquestionsRepository.update(answerquestion)

    return right({
      answerquestion,
    })
  }
}
