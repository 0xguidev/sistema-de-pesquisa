import { Controller, Get, Param } from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { FetchSurveyIdUseCase } from '@/domain/use-cases/survey/fetch-survey-id'
import { SurveyDetails } from '@/domain/use-cases/survey/interfaces/survey.interface'

const surveyIdParamSchema = z.object({
  id: z.string().uuid(),
})

type SurveyIdParam = z.infer<typeof surveyIdParamSchema>

@Controller('/surveys/:id')
export class FetchSurveyByIdController {
  constructor(private fetchSurveyByIdUseCase: FetchSurveyIdUseCase) {}

  @Get()
  async handle(
    @CurrentUser()
    user: UserPayload,
    @Param(new ZodValidationPipe(surveyIdParamSchema))
    params: SurveyIdParam,
  ): Promise<SurveyDetails> {
    const { id } = params
    const userId = user.sub

    const survey = await this.fetchSurveyByIdUseCase.execute({
      surveyId: id,
      accountId: userId,
    })

    if (survey.isLeft()) {
      throw new Error('Failed to fetch survey')
    }

    return survey.value.survey
  }
}
