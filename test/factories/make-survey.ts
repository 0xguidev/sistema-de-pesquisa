import { faker } from '@faker-js/faker'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Survey, SurveyProps } from 'src/domain/entities/survey'

export function makeSurvey(
  override: Partial<SurveyProps> = {},
  id?: UniqueEntityID,
) {
  const survey = Survey.create(
    {
      title: faker.lorem.sentence(),
      type: faker.lorem.word(),
      location: faker.lorem.word(),
      ...override,
    },
    id,
  )

  return survey
}
