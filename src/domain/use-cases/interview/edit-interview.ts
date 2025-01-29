import { NotAllowedError } from 'src/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from 'src/core/errors/errors/resource-not-found-error'
import { Either, left, right } from 'src/core/types/either'
import { Interview } from '../../entities/interview'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { InterviewRepository } from '../../repositories/interview-repository'

interface EditInterviewUseCaseRequest {
  interviewId: UniqueEntityID
}

type EditInterviewUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    interview: Interview
  }
>

export class EditInterviewUseCase {
  constructor(private interviewsRepository: InterviewRepository) {}

  async execute({
    interviewId,
  }: EditInterviewUseCaseRequest): Promise<EditInterviewUseCaseResponse> {
    const interview = await this.interviewsRepository.findById(interviewId)

    if (!interview) {
      return left(new ResourceNotFoundError())
    }

    await this.interviewsRepository.update(interview)

    return right({
      interview,
    })
  }
}
