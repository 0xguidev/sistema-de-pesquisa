import { AnswerQuestion } from '../entities/answer-question'

export abstract class AnswerQuestionRepository {
  abstract create(answerQuestion: AnswerQuestion): Promise<void>
}
