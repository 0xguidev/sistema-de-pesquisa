import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Slug } from './value-objects/slug'
import { Entity } from 'src/core/entities/entity'
import { Optional } from '@/core/types/optional'

export interface SurveyProps {
  title: string
  location: string
  type: string
  slug?: Slug
  createdAt?: Date
}

export class Survey extends Entity<SurveyProps> {
  constructor(props: SurveyProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get title(): string {
    return this.props.title
  }

  set title(title: string) {
    this.props.title = title
  }

  get location(): string {
    return this.props.location
  }

  set location(location: string) {
    this.props.location = location
  }

  get type(): string {
    return this.props.type
  }

  set type(type: string) {
    this.props.type = type
  }

  static create(
    props: Optional<SurveyProps, 'slug' | 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    const survey = new Survey(
      {
        ...props,
        slug: props.slug ?? Slug.createFromText(props.title),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return survey
  }
}
