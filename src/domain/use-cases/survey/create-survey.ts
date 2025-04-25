import { Either, right } from 'src/core/types/either'
import { Survey } from 'src/domain/entities/survey'
import { SurveyRepository } from 'src/domain/repositories/survey-repository'

interface CreateSurveyUseCaseRequest {
  title: string
  location: string
  type: string
}

type CreateQuestionUseCaseResponse = Either<
  null,
  {
    survey: Survey
  }
>

export class CreateSurveyUseCase {
  constructor(private surveyRepository: SurveyRepository) {}

  async execute({
    title,
    location,
    type,
  }: CreateSurveyUseCaseRequest): Promise<CreateQuestionUseCaseResponse> {
    const survey = Survey.create({
      title,
      location,
      type,
    })

    await this.surveyRepository.create(survey)

    return right({
      survey,
    })
  }
}
