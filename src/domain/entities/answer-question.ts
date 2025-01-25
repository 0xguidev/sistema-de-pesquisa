import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Slug } from './value-objects/slug'
import { Entity } from 'src/core/entities/entity'

interface AnswerQuestionProps {
  interviewId: UniqueEntityID
  questionId: UniqueEntityID
  answerQuestionId: UniqueEntityID
  slug: Slug
  createdAt?: Date
}

export class AnswerQuestion extends Entity<AnswerQuestionProps> {
  constructor(props: AnswerQuestionProps, id?: UniqueEntityID) {
    super(props, id)
  }
}
