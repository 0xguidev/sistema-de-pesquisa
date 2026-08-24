import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/types/either'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { Question } from '../../entities/question'
import { QuestionRepository } from '../../repositories/question-repository'
import { SurveyRepository } from '../../repositories/survey-repository'

interface FetchQuestionsBySurveyIdUseCaseRequest {
  surveyId: string
  accountId: string
}

type FetchQuestionsBySurveyIdUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    question: Question[]
  }
>

@Injectable()
export class FetchQuestionsBySurveyIdUseCase {
  constructor(
    private questionsRepository: QuestionRepository,
    private surveyRepository: SurveyRepository,
  ) {}

  async execute({
    surveyId,
    accountId,
  }: FetchQuestionsBySurveyIdUseCaseRequest): Promise<FetchQuestionsBySurveyIdUseCaseResponse> {
    const survey = await this.surveyRepository.findByIdAndAccountId(
      surveyId,
      accountId,
    )

    if (!survey) {
      return left(new ResourceNotFoundError())
    }

    const question =
      await this.questionsRepository.findQuestionsBySurveyIdAndAccountId(
        surveyId,
        accountId,
      )

    return right({
      question,
    })
  }
}
