import { InterviewRepository } from '../../repositories/interview-repository'
import { Either, right, left } from 'src/core/types/either'
import { Injectable } from '@nestjs/common'
import { InterviewResponse } from '@/infra/http/controllers/interview/interfaces/interview.interfaces'

interface FetchInterviewsBySurveyIdUseCaseRequest {
  surveyId: string
  accountId: string
  page: number
  limit: number
}

type FetchInterviewsBySurveyIdUseCaseResponse = Either<
  Error,
  {
    interviews: InterviewResponse[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
>

@Injectable()
export class FetchInterviewsBySurveyIdUseCase {
  constructor(private interviewRepository: InterviewRepository) {}

  async execute({
    surveyId,
    accountId,
    page,
    limit,
  }: FetchInterviewsBySurveyIdUseCaseRequest): Promise<FetchInterviewsBySurveyIdUseCaseResponse> {
    if (!surveyId || !accountId) {
      return left(new Error('Missing surveyId or accountId'))
    }

    if (page < 1 || limit < 1) {
      return left(new Error('Invalid pagination parameters'))
    }

    const { data, total } = await this.interviewRepository.findBySurveyId(
      surveyId,
      accountId,
      page,
      limit,
    )

    const totalPages = Math.ceil(total / limit)

    const interviews = data.map((interview) => ({
      id: interview.id,
      accountId: interview.accountId,
      surveyId: interview.surveyId,
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
      answers: interview.answers, // include the answers property as required by InterviewResponse
      questions: interview.answers.map((answer) => ({
        id: answer.id,
        question: answer.question,
        answer: answer.answer,
      })),
    }))

    return right({
      interviews,
      total,
      page,
      limit,
      totalPages,
    })
  }
}
