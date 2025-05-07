import { Injectable } from '@nestjs/common'
import { NotAllowedError } from 'src/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from 'src/core/errors/errors/resource-not-found-error'
import { Either, left, right } from 'src/core/types/either'
import { InterviewRepository } from '../../repositories/interview-repository'

interface DeleteInterviewUseCaseRequest {
  interviewId: string
  accountId: string
}

type DeleteInterviewUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  null
>

@Injectable()
export class DeleteInterviewUseCase {
  constructor(private interviewsRepository: InterviewRepository) {}

  async execute({
    interviewId,
    accountId,
  }: DeleteInterviewUseCaseRequest): Promise<DeleteInterviewUseCaseResponse> {
    const interview = await this.interviewsRepository.findById(interviewId)

    if (!interview) {
      return left(new ResourceNotFoundError())
    }

    if (accountId !== interview.accountId.toString()) {
      return left(new NotAllowedError())
    }

    await this.interviewsRepository.delete(interview.id.toString())

    return right(null)
  }
}
