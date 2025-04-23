import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { OptionAnswer } from 'src/domain/entities/option-answer'
import { OptionAnswerRepository } from 'src/domain/repositories/option-answer-repository'

export class InMemoryOptionAnswersRepository implements OptionAnswerRepository {
  public items: OptionAnswer[] = []

  constructor() {} // private survey: InMemorySurveyRepository,
  async findManyByQuestionId(questionId: string): Promise<OptionAnswer[] | null> {
    const options = this.items.filter(
      (item) => item.questionId.toString() === questionId,
    )

    if (!options) {
      return null
    }

    return options
  }

  async findById(id: string) {
    const optionanswer = this.items.find(
      (item) => item.id === new UniqueEntityID(id),
    )

    if (!optionanswer) {
      return null
    }

    return optionanswer
  }

  async create(optionanswer: OptionAnswer) {
    this.items.push(optionanswer)
  }

  async save(optionanswer: OptionAnswer) {
    const itemIndex = this.items.findIndex(
      (item) => item.id === optionanswer.id,
    )

    this.items[itemIndex] = optionanswer
  }

  async delete(optionAnswer: OptionAnswer) {
    const itemIndex = this.items.findIndex(
      (item) => item.id === optionAnswer.id,
    )

    this.items.splice(itemIndex, 1)
  }
}
