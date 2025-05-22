import { EditSurveyUseCase } from '@/domain/use-cases/survey/edit-survey'
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Param,
  Put,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'

const editSurveyBodySchema = z.object({
  title: z.string().optional(),
  location: z.string().optional(),
})

const bodyValidationPipe = new ZodValidationPipe(editSurveyBodySchema)

type EditSurveyBodySchema = z.infer<typeof editSurveyBodySchema>

@Controller('/surveys/:id')
export class EditSurveyController {
  constructor(private editSurvey: EditSurveyUseCase) {}

  @Put()
  @HttpCode(204)
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(bodyValidationPipe) body: EditSurveyBodySchema,
    @Param('id') surveyId: string,
  ) {
    const { title, location } = body
    const accountId = user.sub

    if (!title && !location) {
      throw new BadRequestException()
    }

    const result = await this.editSurvey.execute({
      surveyId,
      accountId,
      surveyTitle: title,
      surveyLocation: location,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
