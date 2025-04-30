import { CreateSurveyUseCase } from '@/domain/use-cases/survey/create-survey'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'

const surveyBodySchema = z.object({
  title: z.string(),
  location: z.string(),
  type: z.string(),
})

type SurveyBodySchema = z.infer<typeof surveyBodySchema>

@Controller('/surveys')
export class CreateSurveyController {
  constructor(private survey: CreateSurveyUseCase) {}

  @Post()
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(new ZodValidationPipe(surveyBodySchema))
    body: SurveyBodySchema,
  ) {
    const { title, location, type } = body
    const userId = user.sub

    const result = await this.survey.execute({
      title,
      location,
      type,
      accountId: userId,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
