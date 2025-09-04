import { Entity } from "@/core/entities/entity"
import { UniqueEntityID } from "@/core/entities/unique-entity-id"

export interface ConditionalRuleProps {
  questionId: UniqueEntityID
  dependsOnQuestionId: UniqueEntityID
  dependsOnOptionId: UniqueEntityID
  operator: string
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

  get dependsOnOptionId() {
    return this.props.dependsOnOptionId
  }

  set dependsOnOptionId(id: UniqueEntityID) {
    this.props.dependsOnOptionId = id
  }

  get operator() {
    return this.props.operator
  }

  set operator(operator: string) {
    this.props.operator = operator
  }

  static create(props: ConditionalRuleProps, id?: UniqueEntityID) {
    const conditionalRule = new ConditionalRule(props, id)

    return conditionalRule
  }
}
