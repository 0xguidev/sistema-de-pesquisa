import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Slug } from './value-objects/slug'
import { Entity } from 'src/core/entities/entity'

interface SurveyProps {
  title: string
  typeSurvey?: string
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

  static create(props: SurveyProps, id?: UniqueEntityID) {
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
