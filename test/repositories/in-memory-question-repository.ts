import { Question } from 'src/domain/entities/question'
import { QuestionRepository } from 'src/domain/repositories/question-repository'

export class InMemoryQuestionRepository implements QuestionRepository {
  public items: Question[] = []

  constructor() {} // private survey: InMemorySurveyRepository,

  async findById(id: string) {
    const question = this.items.find((item) => item.id.toString() === id)

    if (!question) {
      return null
    }

    return question
  }

  async create(question: Question) {
    this.items.push(question)
  }

  async save(question: Question) {
    const itemIndex = this.items.findIndex((item) => item.id === question.id)

    this.items[itemIndex] = question
  }

  async update(question: Question): Promise<void> {
    const result = this.findById(question.id.toString())
    if (!result) {
      throw new Error('Question not found')
    }

    this.save(question)
  }

  async delete(id: string) {
    const itemIndex = this.items.findIndex((item) => item.id.toString() === id)

    this.items.splice(itemIndex, 1)
  }
}
