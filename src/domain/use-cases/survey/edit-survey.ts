import { NotAllowedError } from 'src/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from 'src/core/errors/errors/resource-not-found-error'
import { Either, left, right } from 'src/core/types/either'
import { Survey } from '../../entities/survey'
import { SurveyRepository } from '../../repositories/survey-repository'

interface EditSurveyUseCaseRequest {
  surveyId: string
  surveyTitle: string
}

type EditSurveyUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    survey: Survey
  }
>

export class EditSurveyUseCase {
  constructor(private surveysRepository: SurveyRepository) {}

  async execute({
    surveyId,
    surveyTitle,
  }: EditSurveyUseCaseRequest): Promise<EditSurveyUseCaseResponse> {
    const survey = await this.surveysRepository.findById(surveyId)

    if (!survey) {
      return left(new ResourceNotFoundError())
    }

    survey.title = surveyTitle

    await this.surveysRepository.update(survey)

    return right({
      survey,
    })
  }
}
