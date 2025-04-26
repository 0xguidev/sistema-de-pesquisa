import { Injectable } from '@nestjs/common'
import { NotAllowedError } from 'src/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from 'src/core/errors/errors/resource-not-found-error'
import { Either, left, right } from 'src/core/types/either'
import { QuestionRepository } from '../../repositories/question-repository'

interface DeleteQuestionUseCaseRequest {
  id: string
}

type DeleteQuestionUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  null
>

@Injectable()
export class DeleteQuestionUseCase {
  constructor(private questionsRepository: QuestionRepository) {}

  async execute({
    id,
  }: DeleteQuestionUseCaseRequest): Promise<DeleteQuestionUseCaseResponse> {
    const isQuestion = await this.questionsRepository.findById(id)

    if (!isQuestion) {
      return left(new ResourceNotFoundError())
    }

    await this.questionsRepository.delete(isQuestion.id.toString())

    return right(null)
  }
}
