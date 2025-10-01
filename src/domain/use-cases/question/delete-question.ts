import { Injectable } from '@nestjs/common'
import { NotAllowedError } from 'src/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from 'src/core/errors/errors/resource-not-found-error'
import { Either, left, right } from 'src/core/types/either'
import { QuestionRepository } from '../../repositories/question-repository'

interface DeleteQuestionUseCaseRequest {
  questionId: string
  accountId: string
}

type DeleteQuestionUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  null
>

@Injectable()
export class DeleteQuestionUseCase {
  constructor(private questionsRepository: QuestionRepository) {}

  async execute({
    questionId,
    accountId,
  }: DeleteQuestionUseCaseRequest): Promise<DeleteQuestionUseCaseResponse> {
    const isQuestion = await this.questionsRepository.findById(questionId)

    if (!isQuestion) {
      return left(new ResourceNotFoundError())
    }

    if (accountId !== isQuestion.accountId.toString()) {
      return left(new NotAllowedError())
    }

    // Delete conditional rules related to this question
    await this.questionsRepository.deleteConditionalRulesByQuestionId(isQuestion.id.toString())
    await this.questionsRepository.deleteConditionalRulesByDependsOnQuestionId(isQuestion.id.toString())

    await this.questionsRepository.delete(isQuestion.id.toString())

    return right(null)
  }
}
