import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/types/either'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { Question } from '../../entities/question'
import { QuestionRepository } from '../../repositories/question-repository'

interface FetchQuestionsBySurveyIdUseCaseRequest {
  surveyId: string
  accountId: string
}

type FetchQuestionsBySurveyIdUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    question: Question[]
  }
>

@Injectable()
export class FetchQuestionsBySurveyIdUseCase {
  constructor(private questionsRepository: QuestionRepository) {}

  async execute({
    surveyId,
    accountId,
  }: FetchQuestionsBySurveyIdUseCaseRequest): Promise<FetchQuestionsBySurveyIdUseCaseResponse> {
    const question =
      await this.questionsRepository.findQuestionsBySurveyId(surveyId)

    if (!question) {
      return left(new ResourceNotFoundError())
    }

    if (question[0].accountId.toString() !== accountId) {
      return left(new NotAllowedError())
    }

    return right({
      question,
    })
  }
}
