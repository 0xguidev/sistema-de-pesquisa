import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Survey } from '../entities/survey'

export abstract class SurveyRepository {
  abstract create(survey: Survey): Promise<void>
  abstract findById(id: UniqueEntityID): Promise<Survey | null>
  abstract delete(id: UniqueEntityID): Promise<void>
  abstract update(question: Survey): Promise<void>
}
