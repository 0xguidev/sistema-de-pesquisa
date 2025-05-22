import { NotAllowedError } from 'src/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from 'src/core/errors/errors/resource-not-found-error'
import { Either, left, right } from 'src/core/types/either'
import { Survey } from '../../entities/survey'
import { SurveyRepository } from '../../repositories/survey-repository'
import { Injectable } from '@nestjs/common'

interface EditSurveyUseCaseRequest {
  surveyId: string
  accountId: string
  surveyTitle?: string
  surveyLocation?: string
}

type EditSurveyUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    survey: Survey
  }
>

@Injectable()
export class EditSurveyUseCase {
  constructor(private surveysRepository: SurveyRepository) {}

  async execute({
    surveyId,
    accountId,
    surveyTitle,
    surveyLocation,
  }: EditSurveyUseCaseRequest): Promise<EditSurveyUseCaseResponse> {
    const survey = await this.surveysRepository.findById(surveyId)

    if (!survey) {
      return left(new ResourceNotFoundError())
    }

    if (survey.accountId.toString() !== accountId) {
      return left(new NotAllowedError())
    }

    survey.title = surveyTitle ?? survey.title
    survey.location = surveyLocation ?? survey.location

    await this.surveysRepository.update(survey)

    return right({
      survey,
    })
  }
}
