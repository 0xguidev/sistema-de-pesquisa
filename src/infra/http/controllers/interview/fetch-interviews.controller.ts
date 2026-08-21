import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { FetchInterviewsBySurveyIdUseCase } from '@/domain/use-cases/interview/fetch-interview-by-survey-id'
import { InterviewResponse } from './interfaces/interview.interfaces'

const surveyIdParamSchema = z.object({
  surveyId: z.string().uuid(),
})

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(10),
})

type SurveyIdParam = z.infer<typeof surveyIdParamSchema>
type PaginationQuery = z.infer<typeof paginationQuerySchema>

@Controller('/interviews/survey/:surveyId')
export class FetchInterviewsController {
  constructor(
    private fetchInterviewsBySurveyIdUseCase: FetchInterviewsBySurveyIdUseCase,
  ) {}

  @Get()
  async handle(
    @CurrentUser() user: UserPayload,
    @Param(new ZodValidationPipe(surveyIdParamSchema)) params: SurveyIdParam,
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery,
  ): Promise<{
    interviews: InterviewResponse[]
    total: number
    page: number
    limit: number
  }> {
    const { surveyId } = params
    const userId = user.sub

    const { page, limit } = query

    const result = await this.fetchInterviewsBySurveyIdUseCase.execute({
      surveyId,
      accountId: userId,
      page,
      limit,
    })

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message)
    }

    const interviews = result.value.interviews.map((interview) => ({
      id: interview.id,
      surveyId: interview.surveyId,
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
      answers: interview.answers,
    }))

    return {
      limit: result.value.limit,
      total: result.value.total,
      page: result.value.page,
      interviews,
    }
  }
}
