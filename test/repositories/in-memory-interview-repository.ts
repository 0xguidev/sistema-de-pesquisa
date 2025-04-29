import { Interview } from 'src/domain/entities/interview'
import { InterviewRepository } from 'src/domain/repositories/interview-repository'

export class InMemoryInterviewRepository implements InterviewRepository {
  public items: Interview[] = []

  constructor() {} // private survey: InMemorySurveyRepository,

  async findById(id: string) {
    const interview = this.items.find((item) => item.id.toString() === id)

    if (!interview) {
      return null
    }

    return interview
  }

  async create(interview: Interview) {
    this.items.push(interview)
  }

  async save(interview: Interview) {
    const itemIndex = this.items.findIndex((item) => item.id === interview.id)

    this.items[itemIndex] = interview
  }

  async update(interview: Interview): Promise<void> {
    const result = this.findById(interview.id.toString())
    if (!result) {
      throw new Error('Question not found')
    }

    this.save(interview)
  }

  async delete(id: string) {
    const itemIndex = this.items.findIndex((item) => item.id.toString() === id)

    this.items.splice(itemIndex, 1)
  }
}
