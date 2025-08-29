import { Interview } from '../../entities/interview'
import { InterviewRepository } from '../../repositories/interview-repository'
import { Either, right, left } from 'src/core/types/either'

interface FetchInterviewUseCaseRequest {
  interviewId: string
}

type FetchInterviewUseCaseResponse = Either<
  Error,
  {
    interview: Interview
  }
>

export class FetchInterviewUseCase {
  constructor(private interviewRepository: InterviewRepository) {}

  async execute({
    interviewId,
  }: FetchInterviewUseCaseRequest): Promise<FetchInterviewUseCaseResponse> {
    const interview = await this.interviewRepository.findById(interviewId)

    if (!interview) {
      return left(new Error('Interview not found'))
    }

    return right({
      interview,
    })
  }
}
