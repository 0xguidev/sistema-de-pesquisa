import { AnswerQuestion } from '../entities/answer-question'

export abstract class AnswerQuestionRepository {
  abstract create(answerQuestion: AnswerQuestion): Promise<void>
  abstract findById(id: string): Promise<AnswerQuestion | null>
  abstract findByIdAndAccountId(
    id: string,
    accountId: string,
  ): Promise<AnswerQuestion | null>
  abstract findManyByInterviewId(
    interviewId: string,
    accountId: string,
  ): Promise<AnswerQuestion[]>
  abstract delete(id: string): Promise<void>
  abstract update(answerQuestion: AnswerQuestion): Promise<void>
}
