export interface Question {
  id: string
  title: string
  num: number
  option_answers: OptionAnswer[]
}

export interface OptionAnswer {
  id: string
  option: string
  number: number
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