import { Injectable } from '@nestjs/common'
import { NotAllowedError } from 'src/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from 'src/core/errors/errors/resource-not-found-error'
import { Either, left, right } from 'src/core/types/either'
import { SurveyRepository } from '../../repositories/survey-repository'

interface DeleteSurveyUseCaseRequest {
  surveyId: string
  accountId: string
}

type DeleteSurveyUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  null
>

@Injectable()
export class DeleteSurveyUseCase {
  constructor(private surveysRepository: SurveyRepository) {}

  async execute({
    surveyId,
    accountId,
  }: DeleteSurveyUseCaseRequest): Promise<DeleteSurveyUseCaseResponse> {
    const survey = await this.surveysRepository.findById(surveyId)

    if (!survey) {
      return left(new ResourceNotFoundError())
    }

    if (survey.accountId.toString() !== accountId) {
      return left(new NotAllowedError())
    }

    await this.surveysRepository.delete(survey.id.toString())

    return right(null)
  }
}
