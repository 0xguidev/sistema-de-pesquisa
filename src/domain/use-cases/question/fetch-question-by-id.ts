import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/types/either'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { Question } from '../../entities/question'
import { QuestionRepository } from '../../repositories/question-repository'

interface FetchQuestionByIdUseCaseRequest {
  questionId: string
  accountId: string
}

type FetchQuestionByIdUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    question: Question
  }
>

@Injectable()
export class FetchQuestionByIdUseCase {
  constructor(private questionsRepository: QuestionRepository) {}

  async execute({
    questionId,
    accountId,
  }: FetchQuestionByIdUseCaseRequest): Promise<FetchQuestionByIdUseCaseResponse> {
    const question = await this.questionsRepository.findById(questionId)

    if (!question) {
      return left(new ResourceNotFoundError())
    }

    if (question.accountId.toString() !== accountId) {
      return left(new NotAllowedError())
    }

    return right({
      question,
    })
  }
}
