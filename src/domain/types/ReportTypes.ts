export interface ISimpleOptionsReport {
  answer: string
  count: number
  percentage: number
  num: number
}

export interface ISimpleReport {
  question: string
  questionId: string
  questionNum: number
  options: ISimpleOptionsReport[]
}

export interface ICrossReportAnswer {
  answerA: string
  answerB: string
  count: number
  percentage: number
  numA: number
  numB: number
}

export interface ICrossReport {
  questionA: string
  questionANum: number
  questionAId: string
  questionB: string
  questionBNum: number
  questionBId: string
  answers: ICrossReportAnswer[]
}
