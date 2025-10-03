export interface ConditionalRule {
  questionNum: number
  optionNum: number
}

export interface Question {
  id: string
  questionTitle: string
  questionNum: number
  options: Option[]
  conditionalRules: ConditionalRule[]
}

export interface Option {
  optionTitle: string
  optionNum: number
}

export interface SurveyDetails {
  title: string
  location: string
  type: string
  questions: Question[]
  accountId: string
  slug: string
  createdAt?: Date
  updatedAt?: Date | null
}
