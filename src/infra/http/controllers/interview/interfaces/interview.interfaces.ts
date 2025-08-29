import { IAnswer } from '../../answer/interfaces/answers.interfaces'

export type InterviewDetails = {
  id: string
  surveyId: string
  createdAt: Date
  updatedAt: Date
  answers: IAnswer[]
}

export interface InterviewResponse {
  answers: any
  id: string
  surveyId: string
  createdAt: Date
  updatedAt: Date
}
