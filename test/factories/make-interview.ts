import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Interview, InterviewProps } from 'src/domain/entities/interview'

export function makeInterview(
  override: Partial<InterviewProps> = {},
  id?: UniqueEntityID,
) {
  const interview = Interview.create(
    {
      surveyId: new UniqueEntityID(),
      ...override,
    },
    id,
  )

  return interview
}
