import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { AnswerQuestion } from '@/domain/entities/answer-question'
import { AnswerQuestionRepository } from '@/domain/repositories/answer-question-repository'
import { Injectable } from '@nestjs/common'

@Injectable()
export class PrismaAnswerQuestionRepository
  implements AnswerQuestionRepository
{
  create(answerQuestion: AnswerQuestion): Promise<void> {
    throw new Error('Method not implemented.')
  }
  findById(id: UniqueEntityID): Promise<AnswerQuestion | null> {
    throw new Error('Method not implemented.')
  }
  delete(id: UniqueEntityID): Promise<void> {
    throw new Error('Method not implemented.')
  }
  update(answerQuestion: AnswerQuestion): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
