import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import {
  AnswerQuestion,
  AnswerQuestionProps,
} from 'src/domain/entities/answer-question'

export function makeAnswerQuestion(
  override: Partial<AnswerQuestionProps> = {},
  id?: UniqueEntityID,
) {
  const answerQuestion = AnswerQuestion.create(
    {
      interviewId: new UniqueEntityID(),
      optionAnswerId: new UniqueEntityID(),
      questionId: new UniqueEntityID(),
      accountId: new UniqueEntityID(),
      ...override,
    },
    id,
  )

  return answerQuestion
}
