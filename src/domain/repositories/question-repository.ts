import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Question } from '../entities/question'

export abstract class QuestionRepository {
  abstract create(question: Question): Promise<void>
  abstract findById(id: UniqueEntityID): Promise<Question | null>
  abstract delete(id: UniqueEntityID): Promise<void>
  abstract update(question: Question): Promise<void>
  abstract save(question: Question): Promise<void>
}
