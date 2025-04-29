import { Either, right } from 'src/core/types/either'
import { Interview } from '../../entities/interview'
import { InterviewRepository } from '../../repositories/interview-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Injectable } from '@nestjs/common'

interface CreateInterviewUseCaseRequest {
  surveyId: string
}

type CreateQuestionUseCaseResponse = Either<
  null,
  {
    interview: Interview
  }
>

@Injectable()
export class CreateInterviewUseCase {
  constructor(private interviewRepository: InterviewRepository) {}

  async execute({
    surveyId,
  }: CreateInterviewUseCaseRequest): Promise<CreateQuestionUseCaseResponse> {
    const interview = Interview.create({
      surveyId: new UniqueEntityID(surveyId),
    })

    await this.interviewRepository.create(interview)

    return right({
      interview,
    })
  }
}
