import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { QuestionProps } from '@/domain/entities/question'
import { Injectable } from '@nestjs/common'
import { Either, right } from 'src/core/types/either'
import { Survey } from 'src/domain/entities/survey'
import { SurveyRepository } from 'src/domain/repositories/survey-repository'

interface CreateSurveyUseCaseRequest {
  title: string
  location: string
  type: string
  accountId: string
  questions: QuestionProps[]
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
    questions
  }: CreateSurveyUseCaseRequest): Promise<CreateQuestionUseCaseResponse> {
    const survey = Survey.create({
      title,
      location,
      type,
      accountId: new UniqueEntityID(accountId),
      questions
    })

    await this.surveyRepository.create(survey)

    return right({
      survey,
    })
  }
}
