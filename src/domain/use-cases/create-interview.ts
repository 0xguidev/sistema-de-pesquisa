import { Either, right } from 'src/core/types/either'
import { Interview } from '../entities/interview'
import { InterviewRepository } from '../repositories/interview-repository'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'

interface CreateInterviewUseCaseRequest {
  surveyId: UniqueEntityID
}

type CreateQuestionUseCaseResponse = Either<
  null,
  {
    interview: Interview
  }
>

export class CreateInterview {
  constructor(private interviewRepository: InterviewRepository) {}

  async execute({
    surveyId,
  }: CreateInterviewUseCaseRequest): Promise<CreateQuestionUseCaseResponse> {
    const interview = Interview.create({
      surveyId
    })

    await this.interviewRepository.create(interview)

    return right({
      interview,
    })
  }
}
