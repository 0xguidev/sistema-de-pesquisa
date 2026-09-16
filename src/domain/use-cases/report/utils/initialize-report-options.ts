import { OptionAnswerRepository } from '@/domain/repositories/option-answer-repository'
import { ReportProtection } from '../report-protection'

export async function initializeReportOptions(
  repository: OptionAnswerRepository,
  questionId: string,
  accountId: string,
  protection?: ReportProtection,
) {
  const options = await repository.findManyByQuestionId(questionId, accountId)
  protection?.validateOptions(options)

  return Object.fromEntries(
    options.map((option) => [
      option.optionTitle,
      {
        answer: option.optionTitle,
        num: option.optionNum,
        count: 0,
        percentage: 0,
      },
    ]),
  )
}
