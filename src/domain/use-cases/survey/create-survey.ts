import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Injectable } from '@nestjs/common'
import { Either, right } from '@/core/types/either'
import { Survey } from '@/domain/entities/survey'
import { SurveyRepository } from '@/domain/repositories/survey-repository'

interface CreateSurveyUseCaseRequest {
  title: string
  location: string
  type: string
  accountId: string
}

type CreateQuestionUseCaseResponse = Either<
  null,
  {
    survey: Survey
  }
>

@Injectable()
export class CreateSurveyUseCase {
  constructor(private surveyRepository: SurveyRepository) {}

  async execute({
    title,
    location,
    type,
    accountId,
  }: CreateSurveyUseCaseRequest): Promise<CreateQuestionUseCaseResponse> {
    const survey = Survey.create({
      title,
      location,
      type,
      accountId: new UniqueEntityID(accountId),
    })

    await this.surveyRepository.create(survey)

    return right({
      survey,
    })
  }
}
