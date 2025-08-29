import { Controller, Get, Param, Query } from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { FetchInterviewsBySurveyIdUseCase } from '@/domain/use-cases/interview/fetch-interview-by-survey-id'
import { InterviewResponse } from './interfaces/interview.interfaces'

// Validação do parâmetro surveyId
const surveyIdParamSchema = z.object({
  surveyId: z.string().uuid(),
})

// Validação para paginação (opcional)
const paginationQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
})

type SurveyIdParam = z.infer<typeof surveyIdParamSchema>
type PaginationQuery = z.infer<typeof paginationQuerySchema>

@Controller('/interviews/:surveyId')
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

    const page = query.page ? parseInt(query.page, 10) : 1
    const limit = query.limit ? parseInt(query.limit, 10) : 10

    const result = await this.fetchInterviewsBySurveyIdUseCase.execute({
      surveyId,
      accountId: userId,
      page,
      limit,
    })

    if (result.isLeft()) {
      throw new Error('Failed to fetch interviews')
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
