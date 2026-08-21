import { Injectable } from '@nestjs/common'
import { SurveyRepository } from '../../repositories/survey-repository'
import { Either, right, left } from '@/core/types/either'
import { SurveyDetails } from './interfaces/survey.interface'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

interface FetchSurveyUseCaseRequest {
  surveyId: string
  accountId: string
}

type FetchSurveyUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    survey: SurveyDetails
  }
>
@Injectable()
export class FetchSurveyIdUseCase {
  constructor(private surveyRepository: SurveyRepository) {}

  async execute({
    surveyId,
    accountId,
  }: FetchSurveyUseCaseRequest): Promise<FetchSurveyUseCaseResponse> {
    const survey = await this.surveyRepository.findSurveydetails(
      surveyId,
      accountId,
    )

    if (!survey) {
      return left(new ResourceNotFoundError())
    }

    return right({
      survey,
    })
  }
}
