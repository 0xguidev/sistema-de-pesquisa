import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { OptionAnswer } from '@/domain/entities/option-answer'
import { OptionAnswerRepository } from '@/domain/repositories/option-answer-repository'
import { Injectable } from '@nestjs/common'

@Injectable()
export class PrismaOptionAnswerRepository implements OptionAnswerRepository {
  create(optionanswer: OptionAnswer): Promise<void> {
    throw new Error('Method not implemented.')
  }
  findById(id: UniqueEntityID): Promise<OptionAnswer | null> {
    throw new Error('Method not implemented.')
  }
  delete(id: UniqueEntityID): Promise<void> {
    throw new Error('Method not implemented.')
  }
  update(optionanswer: OptionAnswer): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
