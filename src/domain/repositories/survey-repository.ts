import { Survey } from '../entities/survey'
import { SurveyDetails } from '../use-cases/survey/interfaces/survey.interface'

export abstract class SurveyRepository {
  abstract create(survey: Survey): Promise<void>
  abstract findById(id: string): Promise<Survey | null>
  abstract findSurveydetails(
    id: string,
    accountId: string,
  ): Promise<SurveyDetails | null>
  abstract delete(id: string): Promise<void>
  abstract update(survey: Survey): Promise<void>
  abstract findManyWithPagination(
    page: number,
    accountId: string,
  ): Promise<{ surveys: { id: string; title: string }[]; total: number }>
}
