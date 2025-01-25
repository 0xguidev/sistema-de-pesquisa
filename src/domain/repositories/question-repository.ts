import { Question } from '../entities/question'

export abstract class QuestionRepository {
  abstract create(question: Question): Promise<void>
}
