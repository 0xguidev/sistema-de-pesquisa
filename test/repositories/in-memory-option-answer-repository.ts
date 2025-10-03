import { OptionAnswer } from 'src/domain/entities/option-answer'
import { OptionAnswerRepository } from 'src/domain/repositories/option-answer-repository'

export class InMemoryOptionAnswersRepository implements OptionAnswerRepository {
  public items: OptionAnswer[] = []

  constructor() {} // private survey: InMemorySurveyRepository,
  async findManyByQuestionId(
    questionId: string,
  ): Promise<OptionAnswer[] | null> {
    const options = this.items.filter(
      (item) => item.questionId.toString() === questionId,
    )

    if (!options) {
      return null
    }

    return options
  }

  async findById(id: string) {
    const optionanswer = this.items.find((item) => item.id.toString() === id)

    if (!optionanswer) {
      return null
    }

    return optionanswer
  }

  async findOptionByQuestionIdAndOptionNum(
    questionId: string,
    optionNum: number,
  ): Promise<OptionAnswer | null> {
    const optionAnswer = this.items.find(
      (item) =>
        item.questionId.toString() === questionId && item.optionNum === optionNum,
    )

    if (!optionAnswer) {
      return null
    }

    return optionAnswer
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

  async deleteConditionalRulesByDependsOnOptionId(
    dependsOnOptionId: string,
  ): Promise<void> {
    // Since this is an in-memory repository, we simulate the deletion of conditional rules
    // that depend on the given option ID by filtering them out from a conditionalRules array.
    // However, this repository does not have a conditionalRules array, so this method can be a no-op
    // or you can implement a conditionalRules array similar to the question repository if needed.
  }
}
