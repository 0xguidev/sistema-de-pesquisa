import { Either, right, left } from '@/core/types/either'
import { OptionAnswerRepository } from '@/domain/repositories/option-answer-repository'

interface GetOptionsByQuestionIdUseCaseRequest {
  questionId: string
  userId: string
}

type GetOptionsByQuestionIdUseCaseResponse = Either<
  Error,
  Array<{
    id: string
    questionId: string
    optionTitle: string
    optionNum: number
  }>
>

export class GetOptionsByQuestionIdUseCase {
  constructor(private optionAnswerRepository: OptionAnswerRepository) {}

  async execute({
    questionId,
    userId,
  }: GetOptionsByQuestionIdUseCaseRequest): Promise<GetOptionsByQuestionIdUseCaseResponse> {
    const options =
      await this.optionAnswerRepository.findManyByQuestionId(questionId, userId)

    if (!options) {
      return left(new Error('OptionAnswer not found'))
    }

    return right(
      options.map((option) => ({
        id: option.id.toString(),
        questionId: option.questionId.toString(),
        optionTitle: option.optionTitle,
        optionNum: option.optionNum,
      })),
    )
  }
}
