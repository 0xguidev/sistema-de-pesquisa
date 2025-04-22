import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Question } from '@/domain/entities/question'
import { QuestionRepository } from '@/domain/repositories/question-repository'
import { Injectable } from '@nestjs/common'

@Injectable()
export class PrismaQuestionRepository implements QuestionRepository {
  create(question: Question): Promise<void> {
    throw new Error('Method not implemented.')
  }
  findById(id: UniqueEntityID): Promise<Question | null> {
    throw new Error('Method not implemented.')
  }
  delete(id: UniqueEntityID): Promise<void> {
    throw new Error('Method not implemented.')
  }
  update(question: Question): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
