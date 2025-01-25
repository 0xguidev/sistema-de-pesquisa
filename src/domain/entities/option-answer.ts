import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Slug } from './value-objects/slug'
import { Entity } from 'src/core/entities/entity'

interface OptionAnswerProps {
  answerTitle: string
  answerNum: string
  questionId: UniqueEntityID
  slug?: Slug
  createdAt?: Date
}

export class OptionAnswer extends Entity<OptionAnswerProps> {
  constructor(props: OptionAnswerProps, id?: UniqueEntityID) {
    super(props, id)
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
