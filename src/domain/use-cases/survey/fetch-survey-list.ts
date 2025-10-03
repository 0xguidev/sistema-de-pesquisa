import { Injectable } from '@nestjs/common'
import { SurveyRepository } from '../../repositories/survey-repository'
import { Either, right, left } from 'src/core/types/either'

interface SurveyListUseCaseRequest {
  page: number
  accountId: string
}

type FetchSurveyListUseCaseResponse = Either<
  Error,
  {
    surveys: { id: string; title: string }[]
    total: number
  }
>

@Injectable()
export class FetchSurveyListUseCase {
  constructor(private surveyRepository: SurveyRepository) {}

  async execute({
    page,
    accountId,
  }: SurveyListUseCaseRequest): Promise<FetchSurveyListUseCaseResponse> {
    try {
      const result = await this.surveyRepository.findManyWithPagination(
        page,
        accountId,
      )

      return right({
        surveys: result.surveys,
        total: result.total,
      })
    } catch {
      return left(new Error('Failed to fetch surveys'))
    }
  }
}
