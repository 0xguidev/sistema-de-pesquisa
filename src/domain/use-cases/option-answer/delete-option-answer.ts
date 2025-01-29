import { Injectable } from '@nestjs/common'
import { NotAllowedError } from 'src/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from 'src/core/errors/errors/resource-not-found-error'
import { Either, left, right } from 'src/core/types/either'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { OptionAnswerRepository } from 'src/domain/repositories/option-answer-repository'

interface DeleteOptionAnswerUseCaseRequest {
  optionAnswerId: UniqueEntityID
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
    const optionanswer =
      await this.optionanswersRepository.findById(optionAnswerId)

    if (!optionanswer) {
      return left(new ResourceNotFoundError())
    }

    await this.optionanswersRepository.delete(optionanswer.id)

    return right(null)
  }
}
