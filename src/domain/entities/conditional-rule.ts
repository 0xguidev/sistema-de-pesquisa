import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

export interface ConditionalRuleProps {
  questionId: UniqueEntityID
  dependsOnQuestionId: UniqueEntityID
  dependsOnQuestionNumber: number
  dependsOnOptionId: UniqueEntityID
  dependsOnOptionNumber: number
  surveyId: UniqueEntityID
}

export class ConditionalRule extends Entity<ConditionalRuleProps> {
  constructor(props: ConditionalRuleProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get questionId() {
    return this.props.questionId
  }

  set questionId(id: UniqueEntityID) {
    this.props.questionId = id
  }

  get dependsOnQuestionId() {
    return this.props.dependsOnQuestionId
  }

  set dependsOnQuestionId(id: UniqueEntityID) {
    this.props.dependsOnQuestionId = id
  }

  get dependsOnQuestionNumber() {
    return this.props.dependsOnQuestionNumber
  }

  set dependsOnQuestionNumber(number: number) {
    this.props.dependsOnQuestionNumber = number
  }

  get dependsOnOptionNumber() {
    return this.props.dependsOnOptionNumber
  }

  set dependsOnOptionNumber(number: number) {
    this.props.dependsOnOptionNumber = number
  }

  get surveyId() {
    return this.props.surveyId
  }

  set surveyId(id: UniqueEntityID) {
    this.props.surveyId = id
  }

  static create(props: ConditionalRuleProps, id?: UniqueEntityID) {
    const conditionalRule = new ConditionalRule(props, id)

    return conditionalRule
  }
}
