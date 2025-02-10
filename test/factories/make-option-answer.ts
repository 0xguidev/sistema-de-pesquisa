import { faker } from '@faker-js/faker'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { OptionAnswer, OptionAnswerProps } from 'src/domain/entities/option-answer'
export function makeOptionAnswer(
  override: Partial<OptionAnswerProps> = {},
  id?: UniqueEntityID,
) {
  const optionanswer = OptionAnswer.create(
    {
      questionId: new UniqueEntityID(),
      answerTitle: faker.lorem.sentence(),
      answerNum: faker.number.int(),
      ...override,
    },
    id,
  )

  return optionanswer
}
