import { Either, left, right } from '@/core/types/either'
import { Interview } from '../../entities/interview'
import { InterviewRepository } from '../../repositories/interview-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Injectable } from '@nestjs/common'
import { SurveyRepository } from '../../repositories/survey-repository'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

interface CreateInterviewUseCaseRequest {
  surveyId: string
  accountId: string
}

type CreateQuestionUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    interview: Interview
  }
>

@Injectable()
export class CreateInterviewUseCase {
  constructor(
    private interviewRepository: InterviewRepository,
    private surveyRepository: SurveyRepository,
  ) {}

  async execute({
    surveyId,
    accountId,
  }: CreateInterviewUseCaseRequest): Promise<CreateQuestionUseCaseResponse> {
    const survey = await this.surveyRepository.findByIdAndAccountId(
      surveyId,
      accountId,
    )

    if (!survey) {
      return left(new ResourceNotFoundError())
    }

    const interview = Interview.create({
      surveyId: new UniqueEntityID(surveyId),
      accountId: new UniqueEntityID(accountId),
    })

    await this.interviewRepository.create(interview)

    return right({
      interview,
    })
  }
}
