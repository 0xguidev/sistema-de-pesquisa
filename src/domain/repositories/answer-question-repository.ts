import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { AnswerQuestion } from '../entities/answer-question'

export abstract class AnswerQuestionRepository {
  abstract create(answerQuestion: AnswerQuestion): Promise<void>
  abstract findById(id: UniqueEntityID): Promise<AnswerQuestion | null>
  abstract delete(id: UniqueEntityID): Promise<void>
  abstract update(answerQuestion: AnswerQuestion): Promise<void>
}
