import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Entity } from 'src/core/entities/entity'
import { Optional } from '@/core/types/optional'

export interface InterviewProps {
  surveyId: UniqueEntityID
  accountId: UniqueEntityID
  createdAt: Date
  updatedAt?: Date | null
}

export class Interview extends Entity<InterviewProps> {
  constructor(props: InterviewProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get surveyId() {
    return this.props.surveyId
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  get accountId() {
    return this.props.accountId
  }

  static create(
    props: Optional<InterviewProps, 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    const interview = new Interview(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return interview
  }
}
