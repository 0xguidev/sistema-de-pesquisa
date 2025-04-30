import { AnswerQuestion } from 'src/domain/entities/answer-question'
import { AnswerQuestionRepository } from 'src/domain/repositories/answer-question-repository'

export class InMemoryAnswerQuestionRepository
  implements AnswerQuestionRepository
{
  public items: AnswerQuestion[] = []

  constructor() {} // private survey: InMemorySurveyRepository,

  async findById(id: string) {
    const answerquestion = this.items.find((item) => item.id.toString() === id)

    if (!answerquestion) {
      return null
    }

    return answerquestion
  }
  async create(answerquestion: AnswerQuestion) {
    this.items.push(answerquestion)
  }

  async save(answerquestion: AnswerQuestion) {
    const itemIndex = this.items.findIndex(
      (item) => item.id === answerquestion.id,
    )

    this.items[itemIndex] = answerquestion
  }

  async update(answerquestion: AnswerQuestion): Promise<void> {
    const result = this.findById(answerquestion.id.toString())
    if (!result) {
      throw new Error('Question not found')
    }

    this.save(answerquestion)
  }

  async delete(id: string) {
    const itemIndex = this.items.findIndex((item) => item.id.toString() === id)

    this.items.splice(itemIndex, 1)
  }
}
