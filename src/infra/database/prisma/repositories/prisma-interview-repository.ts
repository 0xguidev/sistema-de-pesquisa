import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Interview } from '@/domain/entities/interview'
import { InterviewRepository } from '@/domain/repositories/interview-repository'
import { Injectable } from '@nestjs/common'

@Injectable()
export class PrismaInterviewRepository implements InterviewRepository {
  create(interview: Interview): Promise<void> {
    throw new Error('Method not implemented.')
  }
  findById(id: UniqueEntityID): Promise<Interview | null> {
    throw new Error('Method not implemented.')
  }
  delete(id: UniqueEntityID): Promise<void> {
    throw new Error('Method not implemented.')
  }
  update(interview: Interview): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
