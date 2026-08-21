import { Either, right } from '@/core/types/either'
import { OptionAnswerRepository } from '@/domain/repositories/option-answer-repository'
import { Injectable } from '@nestjs/common'

interface GetOptionsByQuestionIdUseCaseRequest {
  questionId: string
  userId: string
}

type GetOptionsByQuestionIdUseCaseResponse = Either<
  never,
  Array<{
    id: string
    questionId: string
    optionTitle: string
    optionNum: number
  }>
>

@Injectable()
export class GetOptionsByQuestionIdUseCase {
  constructor(private optionAnswerRepository: OptionAnswerRepository) {}

  async execute({
    questionId,
    userId,
  }: GetOptionsByQuestionIdUseCaseRequest): Promise<GetOptionsByQuestionIdUseCaseResponse> {
    const options = await this.optionAnswerRepository.findManyByQuestionId(
      questionId,
      userId,
    )

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
