import { Survey } from '../entities/survey'

export abstract class SurveyRepository {
  abstract create(survey: Survey): Promise<void>
  abstract findById(id: string): Promise<Survey | null>
  abstract delete(id: string): Promise<void>
  abstract update(question: Survey): Promise<void>
  abstract findManyWithPagination(
    page: number,
    accountId: string,
  ): Promise<{ id: string; title: string }[]>
}
