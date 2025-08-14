import { Question } from '../entities/question'

export abstract class QuestionRepository {
  abstract create(question: Question): Promise<void>
  abstract findById(id: string): Promise<Question | null>
  abstract findQuestionsBySurveyId(surveyId: string): Promise<Question[]>
  abstract delete(id: string): Promise<void>
  abstract update(question: Question): Promise<void>
}
