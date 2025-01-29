import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Slug } from './value-objects/slug'
import { Entity } from 'src/core/entities/entity'

export interface OptionAnswerProps {
  answerTitle: string
  answerNum: number
  questionId: UniqueEntityID
  slug?: Slug
  createdAt?: Date
}

export class OptionAnswer extends Entity<OptionAnswerProps> {
  constructor(props: OptionAnswerProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get answerTitle(): string {
    return this.props.answerTitle
  }

  get answerNum(): number {
    return this.props.answerNum
  }

  set answerNum(value: number) {
    this.props.answerNum = value
  }

  set answerTitle(value: string) {
    this.props.answerTitle = value
  }

  static create(props: OptionAnswerProps, id?: UniqueEntityID) {
    const answer = new OptionAnswer(
      {
        ...props,
        slug: props.slug ?? Slug.createFromText(props.answerTitle),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return answer
  }
}
