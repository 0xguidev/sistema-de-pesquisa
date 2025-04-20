import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Survey } from '../../entities/survey'
import { SurveyRepository } from '../../repositories/survey-repository'
import { Either, right, left } from 'src/core/types/either'

interface GetSurveyUseCaseRequest {
  surveyId: UniqueEntityID
}

type GetSurveyUseCaseResponse = Either<
  Error,
  {
    survey: Survey
  }
>

export class GetSurveyUseCase {
  constructor(private surveyRepository: SurveyRepository) {}

  async execute({
    surveyId,
  }: GetSurveyUseCaseRequest): Promise<GetSurveyUseCaseResponse> {
    const survey = await this.surveyRepository.findById(surveyId)

    if (!survey) {
      return left(new Error('Survey not found'))
    }

    return right({
      survey,
    })
  }
}
