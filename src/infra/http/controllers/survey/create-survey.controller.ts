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
  questions: z.array(
    z.object({
      questionTitle: z.string(),
      questionNum: z.number(),
      options: z.array(
        z.object({
          optionTitle: z.string(),
          optionNum: z.number(),
        }),
      ),
    }),
  ),
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
    const { title, location, type, questions } = body
    const userId = user.sub

    const result = await this.survey.execute({
      title,
      location,
      type,
      accountId: userId,
      questions,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
