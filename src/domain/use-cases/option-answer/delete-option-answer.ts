import { Injectable } from '@nestjs/common'
import { NotAllowedError } from 'src/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from 'src/core/errors/errors/resource-not-found-error'
import { Either, left, right } from 'src/core/types/either'
import { OptionAnswerRepository } from 'src/domain/repositories/option-answer-repository'

interface DeleteOptionAnswerUseCaseRequest {
  optionAnswerId: string
}

type DeleteOptionAnswerUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  null
>

@Injectable()
export class DeleteOptionAnswerUseCase {
  constructor(private optionanswersRepository: OptionAnswerRepository) {}

  async execute({
    optionAnswerId,
  }: DeleteOptionAnswerUseCaseRequest): Promise<DeleteOptionAnswerUseCaseResponse> {
    const optionAnswer =
      await this.optionanswersRepository.findById(optionAnswerId)

    if (!optionAnswer) {
      return left(new ResourceNotFoundError())
    }

    await this.optionanswersRepository.delete(optionAnswer)

    return right(null)
  }
}
