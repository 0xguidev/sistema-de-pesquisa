import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Entity } from 'src/core/entities/entity'
import { Optional } from '@/core/types/optional'

export interface AnswerQuestionProps {
  interviewId: UniqueEntityID
  questionId: UniqueEntityID
  optionAnswerId: UniqueEntityID
  accountId: UniqueEntityID
  createdAt: Date
  updatedAt?: Date | null
}

export class AnswerQuestion extends Entity<AnswerQuestionProps> {
  constructor(props: AnswerQuestionProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get interviewId() {
    return this.props.interviewId
  }

  get questionId() {
    return this.props.questionId
  }

  get optionAnswerId() {
    return this.props.optionAnswerId
  }
  
  get accountId() {
    return this.props.accountId
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  set optionAnswerId(value) {
    this.props.optionAnswerId = value
  }

  static create(
    props: Optional<AnswerQuestionProps, 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    const answer = new AnswerQuestion(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return answer
  }
}
