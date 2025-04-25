import { Survey } from 'src/domain/entities/survey'
import { SurveyRepository } from 'src/domain/repositories/survey-repository'

export class InMemorySurveyRepository implements SurveyRepository {
  public items: Survey[] = []

  constructor() {}

  async findById(id: string) {
    const survey = this.items.find((item) => item.id.toString() === id)

    if (!survey) {
      return null
    }

    return survey
  }

  async create(survey: Survey) {
    this.items.push(survey)
  }

  async save(survey: Survey) {
    const itemIndex = this.items.findIndex((item) => item.id === survey.id)

    this.items[itemIndex] = survey
  }

  async update(survey: Survey): Promise<void> {
    const result = this.findById(survey.id.toString())
    if (!result) {
      throw new Error('Survey not found')
    }

    this.save(survey)
  }

  async delete(id: string) {
    const itemIndex = this.items.findIndex((item) => item.id.toString() === id)

    this.items.splice(itemIndex, 1)
  }
}
