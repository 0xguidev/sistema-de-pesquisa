import { Interview } from '../../entities/interview'
import { InterviewRepository } from '../../repositories/interview-repository'
import { Either, right, left } from 'src/core/types/either'

interface GetInterviewUseCaseRequest {
  interviewId: string
}

type GetInterviewUseCaseResponse = Either<
  Error,
  {
    interview: Interview
  }
>

export class GetInterviewUseCase {
  constructor(private interviewRepository: InterviewRepository) {}

  async execute({
    interviewId,
  }: GetInterviewUseCaseRequest): Promise<GetInterviewUseCaseResponse> {
    const interview = await this.interviewRepository.findById(interviewId)

    if (!interview) {
      return left(new Error('Interview not found'))
    }

    return right({
      interview,
    })
  }
}
