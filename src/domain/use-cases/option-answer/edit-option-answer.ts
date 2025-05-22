import { Inject, Injectable } from '@nestjs/common'
import { NotAllowedError } from 'src/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from 'src/core/errors/errors/resource-not-found-error'
import { Either, left, right } from 'src/core/types/either'
import { OptionAnswer } from 'src/domain/entities/option-answer'
import { OptionAnswerRepository } from 'src/domain/repositories/option-answer-repository'

interface EditOptionAnswerUseCaseRequest {
  accountId: string
  optionId: string
  optionTitle?: string
  optionNum?: number
}

type EditOptionAnswerUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    optionAnswer: OptionAnswer
  }
>

@Injectable()
export class EditOptionAnswerUseCase {
  constructor(private optionAnswersRepository: OptionAnswerRepository) {}

  async execute({
    accountId,
    optionId,
    optionTitle,
    optionNum,
  }: EditOptionAnswerUseCaseRequest): Promise<EditOptionAnswerUseCaseResponse> {
    const optionAnswer = await this.optionAnswersRepository.findById(optionId)

    if (!optionAnswer) {
      return left(new ResourceNotFoundError())
    }

    if (optionAnswer.accountId.toString() !== accountId) {
      return left(new NotAllowedError())
    }

    optionAnswer.optionTitle = optionTitle ?? optionAnswer.optionTitle
    optionAnswer.optionNum = optionNum ?? optionAnswer.optionNum

    await this.optionAnswersRepository.save(optionAnswer)

    return right({
      optionAnswer,
    })
  }
}
