import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Slug } from './value-objects/slug'
import { Entity } from 'src/core/entities/entity'
import { Optional } from '@/core/types/optional'

export interface OptionAnswerProps {
  optionTitle: string
  optionNum: number
  questionId: UniqueEntityID
  slug: Slug
  accountId: UniqueEntityID
  createdAt: Date
  updateAt?: Date | null
}

export class OptionAnswer extends Entity<OptionAnswerProps> {
  constructor(props: OptionAnswerProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get optionTitle() {
    return this.props.optionTitle
  }

  get optionNum() {
    return this.props.optionNum
  }

  get questionId() {
    return this.props.questionId
  }

  get slug() {
    return this.props.slug
  }

  get accountId() {
    return this.props.accountId
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updateAt() {
    return this.props.updateAt
  }

  set optionTitle(value: string) {
    this.props.optionTitle = value
  }

  set optionNum(value: number) {
    this.props.optionNum = value
  }

  set slug(value: Slug) {
    this.props.slug = value
  }

  static create(
    props: Optional<OptionAnswerProps, 'slug' | 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    const answer = new OptionAnswer(
      {
        ...props,
        slug: props.slug ?? Slug.createFromText(props.optionTitle),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return answer
  }
}
