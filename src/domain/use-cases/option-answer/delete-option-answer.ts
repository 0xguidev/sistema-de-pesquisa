import { Injectable } from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { Either, left, right } from '@/core/types/either'
import { OptionAnswerRepository } from '@/domain/repositories/option-answer-repository'

interface DeleteOptionAnswerUseCaseRequest {
  optionAnswerId: string
  accountId: string
}

type DeleteOptionAnswerUseCaseResponse = Either<ResourceNotFoundError, null>

@Injectable()
export class DeleteOptionAnswerUseCase {
  constructor(private optionanswersRepository: OptionAnswerRepository) {}

  async execute({
    optionAnswerId,
    accountId,
  }: DeleteOptionAnswerUseCaseRequest): Promise<DeleteOptionAnswerUseCaseResponse> {
    const optionAnswer = await this.optionanswersRepository.findById(
      optionAnswerId,
      accountId,
    )

    if (!optionAnswer) {
      return left(new ResourceNotFoundError())
    }

    // Delete conditional rules that depend on this option
    await this.optionanswersRepository.deleteConditionalRulesByDependsOnOptionId(
      optionAnswer.id.toString(),
    )

    await this.optionanswersRepository.delete(optionAnswer)

    return right(null)
  }
}
