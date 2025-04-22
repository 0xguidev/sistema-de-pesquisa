import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Survey } from '@/domain/entities/survey'
import { SurveyRepository } from '@/domain/repositories/survey-repository'
import { Injectable } from '@nestjs/common'

@Injectable()
export class PrismaSurveyRepository implements SurveyRepository {
  create(survey: Survey): Promise<void> {
    throw new Error('Method not implemented.')
  }
  findById(id: UniqueEntityID): Promise<Survey | null> {
    throw new Error('Method not implemented.')
  }
  delete(id: UniqueEntityID): Promise<void> {
    throw new Error('Method not implemented.')
  }
  update(question: Survey): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
