import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Slug } from './value-objects/slug'
import { Entity } from 'src/core/entities/entity'
import { Optional } from '@/core/types/optional'

export interface QuestionProps {
  questionTitle: string
  questionNum: number
  surveyId: UniqueEntityID
  accountId: UniqueEntityID
  slug: Slug
  createdAt?: Date
  updatedAt?: Date | null
}

export class Question extends Entity<QuestionProps> {
  constructor(props: QuestionProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get questionTitle() {
    return this.props.questionTitle
  }

  set questionTitle(title: string) {
    this.props.questionTitle = title
    this.props.slug = Slug.createFromText(title)
  }

  get questionNum() {
    return this.props.questionNum
  }

  set questionNum(num: number) {
    this.props.questionNum = num
  }

  get accountId() {
    return this.props.accountId
  }

  get surveyId() {
    return this.props.surveyId
  }

  get slug() {
    return this.props.slug
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  static create(
    props: Optional<QuestionProps, 'slug' | 'createdAt'>,
    id?: UniqueEntityID,
  ) {
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
