import { OptionAnswer } from '../entities/option-answer'

export abstract class OptionAnswerRepository {
  abstract findById(
    optionId: string,
    accountId: string,
  ): Promise<OptionAnswer | null>
  abstract findByIdAndQuestionIdAndAccountId(
    optionId: string,
    questionId: string,
    accountId: string,
  ): Promise<OptionAnswer | null>
  abstract findManyByQuestionId(
    questionId: string,
    accountId: string,
  ): Promise<OptionAnswer[] | null>
  abstract findOptionByQuestionIdAndOptionNum(
    questionId: string,
    optionNum: number,
  ): Promise<OptionAnswer | null>
  abstract findOptionByQuestionIdAndOptionNumAndAccountId(
    questionId: string,
    optionNum: number,
    accountId: string,
  ): Promise<OptionAnswer | null>
  abstract create(optionanswer: OptionAnswer): Promise<void>
  abstract save(optionanswer: OptionAnswer): Promise<void>
  abstract delete(optionAnswer: OptionAnswer): Promise<void>
  abstract deleteConditionalRulesByDependsOnOptionId(
    dependsOnOptionId: string,
  ): Promise<void>
}
