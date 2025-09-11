import { ConditionalRule } from '../entities/conditional-rule'
import { Question } from '../entities/question'

export abstract class QuestionRepository {
  abstract create(question: Question): Promise<void>
  abstract findById(id: string): Promise<Question | null>
  abstract findByQuestionNum(
    surveyId: string,
    questionNum: number,
  ): Promise<Question | null>
  abstract findQuestionsBySurveyId(surveyId: string): Promise<Question[]>
  abstract delete(id: string): Promise<void>
  abstract update(question: Question): Promise<void>

  abstract createConditionalRule(rule: ConditionalRule): Promise<void>
  abstract findConditionalRulesByQuestionId(
    questionId: string,
  ): Promise<ConditionalRule[]>
  abstract deleteConditionalRule(id: string): Promise<void>
  abstract updateConditionalRule(rule: ConditionalRule): Promise<void>
}
