import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Slug } from './value-objects/slug'
import { Entity } from 'src/core/entities/entity'

interface InterviewProps {
  surveyId: UniqueEntityID
  slug: Slug
  createdAt?: Date
}

export class Interview extends Entity<InterviewProps> {
  constructor(props: InterviewProps, id?: UniqueEntityID) {
    super(props, id)
  }
}
