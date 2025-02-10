import { faker } from '@faker-js/faker'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Question, QuestionProps } from 'src/domain/entities/question'

export function makeQuestion(
  override: Partial<QuestionProps> = {},
  id?: UniqueEntityID,
) {
  const question = Question.create(
    {
      surveyId: new UniqueEntityID(),
      questionTitle: faker.lorem.sentence(),
      questionNum: faker.number.int(),
      ...override,
    },
    id,
  )

  return question
}
