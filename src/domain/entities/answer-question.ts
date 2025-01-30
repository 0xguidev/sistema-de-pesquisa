import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Slug } from './value-objects/slug'
import { Entity } from 'src/core/entities/entity'

export interface AnswerQuestionProps {
  interviewId: UniqueEntityID
  questionId: UniqueEntityID
  optionAnswerId: UniqueEntityID
  slug?: Slug
  createdAt?: Date
}

export class AnswerQuestion extends Entity<AnswerQuestionProps> {
  constructor(props: AnswerQuestionProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get interviewId(): UniqueEntityID {
    return this.props.interviewId
  }

  get questionId(): UniqueEntityID {
    return this.props.questionId
  }

  get optionAnswerId(): UniqueEntityID {
    return this.props.optionAnswerId
  }

  set interviewId(value: UniqueEntityID) {
    this.props.interviewId = value
  }

  set questionId(value: UniqueEntityID) {
    this.props.questionId = value
  }

  set optionAnswerId(value: UniqueEntityID) {
    this.props.optionAnswerId = value
  }

  static create(props: AnswerQuestionProps, id?: UniqueEntityID) {
    const answerQuestion = new AnswerQuestion(props, id)

    return answerQuestion
  }
}
