import { Interview } from '../../entities/interview'
import { InterviewRepository } from '../../repositories/interview-repository'
import { Either, right, left } from '@/core/types/either'
import { Injectable } from '@nestjs/common'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

interface FetchInterviewUseCaseRequest {
  interviewId: string
  accountId: string
}

type FetchInterviewUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    interview: Interview
  }
>

@Injectable()
export class FetchInterviewUseCase {
  constructor(private interviewRepository: InterviewRepository) {}

  async execute({
    interviewId,
    accountId,
  }: FetchInterviewUseCaseRequest): Promise<FetchInterviewUseCaseResponse> {
    const interview = await this.interviewRepository.findById(interviewId)

    if (!interview) {
      return left(new ResourceNotFoundError())
    }

    if (interview.accountId.toString() !== accountId) {
      return left(new NotAllowedError())
    }

    return right({
      interview,
    })
  }
}
