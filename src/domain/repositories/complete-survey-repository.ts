import { ConditionalRule } from '../entities/conditional-rule'
import { OptionAnswer } from '../entities/option-answer'
import { Question } from '../entities/question'
import { Survey } from '../entities/survey'

export interface CompleteSurvey {
  survey: Survey
  questions: Question[]
  options: OptionAnswer[]
  conditionalRules: ConditionalRule[]
}

/** Persistence boundary for the complete survey aggregate. */
export abstract class CompleteSurveyRepository {
  abstract createComplete(data: CompleteSurvey): Promise<void>
}
