import { Interview } from '../entities/interview'

export abstract class InterviewRepository {
  abstract create(interview: Interview): Promise<void>
  abstract findById(id: string): Promise<Interview | null>
  abstract delete(id: string): Promise<void>
  abstract update(interview: Interview): Promise<void>
}
