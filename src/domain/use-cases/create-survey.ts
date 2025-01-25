import { Either, right } from 'src/core/types/either'
import { Survey } from '../entities/survey'
import { SurveyRepository } from '../repositories/survey-repository'

interface CreateSurveyUseCaseRequest {
  title: string
}

type CreateQuestionUseCaseResponse = Either<
  null,
  {
    survey: Survey
  }
>

export class CreateSurvey {
  constructor(private surveyRepository: SurveyRepository) {}

  async execute({
    title,
  }: CreateSurveyUseCaseRequest): Promise<CreateQuestionUseCaseResponse> {
    const survey = Survey.create({
      title,
    })

    await this.surveyRepository.create(survey)

    return right({
      survey,
    })
  }
}
