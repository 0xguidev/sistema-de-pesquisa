import { Controller, Get, Query } from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { FetchSurveyListUseCase } from '@/domain/use-cases/survey/fetch-survey-list'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'

const surveyListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
})

type SurveyListQuery = z.infer<typeof surveyListQuerySchema>

@Controller('/surveys')
export class FetchSurveyListController {
  constructor(private fetchSurveyListUseCase: FetchSurveyListUseCase) {}

  @Get()
  async handle(
    @CurrentUser()
    user: UserPayload,
    @Query(new ZodValidationPipe(surveyListQuerySchema))
    query: SurveyListQuery,
  ) {
    const { page } = query
    const userId = user.sub

    console.log('userId', userId)

    const result = await this.fetchSurveyListUseCase.execute({
      page,
      accountId: userId,
    })

    if (result.isLeft()) {
      throw new Error('Failed to fetch surveys')
    }

    return result.value.surveys
  }
}
