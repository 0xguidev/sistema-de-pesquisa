import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Slug } from './value-objects/slug'
import { Entity } from 'src/core/entities/entity'

interface QuestionProps {
  questionTitle: string
  questionNum: number
  surveyId: UniqueEntityID
  slug?: Slug
  createdAt?: Date
}

export class Question extends Entity<QuestionProps> {
  constructor(props: QuestionProps, id?: UniqueEntityID) {
    super(props, id)
  }

  static create(props: QuestionProps, id?: UniqueEntityID) {
    const question = new Question(
      {
        ...props,
        slug: props.slug ?? Slug.createFromText(props.questionTitle),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return question
  }
}
