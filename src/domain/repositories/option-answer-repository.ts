import { OptionAnswer } from '../entities/option-answer'

export abstract class OptionAnswerRepository {
  abstract findById(id: string): Promise<OptionAnswer | null>
  abstract findManyByQuestionId(
    questionId: string,
  ): Promise<OptionAnswer[] | null>
  abstract create(optionanswer: OptionAnswer): Promise<void>
  abstract save(optionanswer: OptionAnswer): Promise<void>
  abstract delete(optionAnswer: OptionAnswer): Promise<void>
}
