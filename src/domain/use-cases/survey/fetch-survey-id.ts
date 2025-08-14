import { Injectable } from '@nestjs/common'
import { SurveyRepository } from '../../repositories/survey-repository'
import { Either, right, left } from 'src/core/types/either'
import { SurveyDetails } from './interfaces/survey.interface'

interface FetchSurveyUseCaseRequest {
  surveyId: string
  accountId: string
}

type FetchSurveyUseCaseResponse = Either<
  Error,
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
      return left(new Error('Survey not found'))
    }

    return right({
      survey,
    })
  }
}
