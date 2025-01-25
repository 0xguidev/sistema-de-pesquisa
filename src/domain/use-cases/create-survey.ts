import { Survey } from '../entities/survey'
import { SurveyRepository } from '../repositories/survey-repository'

interface CreateAnswerUseCaseRequest {
  title: string
}

export class CreateSurvey {
  constructor(private surveyRepository: SurveyRepository) {}

  async execute({ title }: CreateAnswerUseCaseRequest): Promise<Survey> {
    const survey = Survey.create({
      title,
    })

    await this.surveyRepository.create(survey)

    return survey
  }
}
