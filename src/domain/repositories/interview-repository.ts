import { Interview } from '../entities/interview'

export abstract class InterviewRepository {
  abstract create(interview: Interview): Promise<void>
}
