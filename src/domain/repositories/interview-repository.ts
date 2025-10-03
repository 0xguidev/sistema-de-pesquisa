import { Interview } from '../entities/interview'

export abstract class InterviewRepository {
  abstract create(interview: Interview): Promise<void>
  abstract findById(id: string): Promise<Interview | null>
  abstract findBySurveyId(
    surveyId: string,
    accountId: string,
    page: number,
    limit: number,
  ): Promise<{
    data: {
      id: string
      surveyId: string
      accountId: string
      createdAt: Date
      updatedAt: Date
      answers: {
        answerId: string
        question: {
          questionId: string
          title: string
          number: number
        }
        option: {
          optionId: string
          title: string
          number: number
        }
      }[]
    }[]
    total: number
  }>
  abstract delete(id: string): Promise<void>
  abstract update(interview: Interview): Promise<void>
}
