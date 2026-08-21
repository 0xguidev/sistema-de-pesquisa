import { EditSurveyUseCase } from '@/domain/use-cases/survey/edit-survey'
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Param,
  Put,
  NotFoundException,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

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
      if (result.value instanceof ResourceNotFoundError) {
        throw new NotFoundException(result.value.message)
      }
      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException(result.value.message)
      }
    }
  }
}
