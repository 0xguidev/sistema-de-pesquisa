import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { OptionAnswer } from '../entities/option-answer'

export abstract class OptionAnswerRepository {
  abstract create(optionanswer: OptionAnswer): Promise<void>
  abstract findById(id: UniqueEntityID): Promise<OptionAnswer | null>
  abstract delete(id: UniqueEntityID): Promise<void>
  abstract update(optionanswer: OptionAnswer): Promise<void>
}
