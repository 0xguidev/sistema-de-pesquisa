import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Interview } from '../entities/interview'

export abstract class InterviewRepository {
  abstract create(interview: Interview): Promise<void>
  abstract findById(id: UniqueEntityID): Promise<Interview | null>
  abstract delete(id: UniqueEntityID): Promise<void>
  abstract update(interview: Interview): Promise<void>
}
