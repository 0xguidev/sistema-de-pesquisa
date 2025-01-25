import { OptionAnswer } from '../entities/option-answer'

export abstract class OptionAnswerRepository {
  abstract create(optionanswer: OptionAnswer): Promise<void>
}
