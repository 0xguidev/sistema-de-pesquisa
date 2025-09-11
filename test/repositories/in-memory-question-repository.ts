import { Question } from 'src/domain/entities/question'
import { QuestionRepository } from 'src/domain/repositories/question-repository'
import { ConditionalRule } from 'src/domain/entities/conditional-rule'

export class InMemoryQuestionRepository implements QuestionRepository {
  public items: Question[] = []
  public conditionalRules: ConditionalRule[] = []

  async findById(id: string) {
    const question = this.items.find((item) => item.id.toString() === id)

    if (!question) {
      return null
    }

    return question
  }

  async findByQuestionNum(surveyId: string, questionNum: number) {
    const question = this.items.find(
      (item) =>
        item.questionNum === questionNum &&
        item.surveyId.toString() === surveyId,
    )

    if (!question) {
      return null
    }

    return question
  }

  async findQuestionsBySurveyId(surveyId: string): Promise<Question[]> {
    return this.items.filter((item) => item.surveyId.toString() === surveyId)
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

  async createConditionalRule(rule: ConditionalRule) {
    this.conditionalRules.push(rule)
  }

  async findConditionalRulesByQuestionId(
    questionId: string,
  ): Promise<ConditionalRule[]> {
    return this.conditionalRules.filter(
      (rule) => rule.questionId.toString() === questionId,
    )
  }

  async deleteConditionalRule(id: string) {
    const itemIndex = this.conditionalRules.findIndex(
      (rule) => rule.id.toString() === id,
    )

    if (itemIndex >= 0) {
      this.conditionalRules.splice(itemIndex, 1)
    }
  }

  async updateConditionalRule(rule: ConditionalRule): Promise<void> {
    const result = this.conditionalRules.find((item) => item.id === rule.id)

    if (!result) {
      throw new Error('Conditional rule not found')
    }

    const itemIndex = this.conditionalRules.findIndex(
      (item) => item.id === rule.id,
    )
    this.conditionalRules[itemIndex] = rule
  }
}
