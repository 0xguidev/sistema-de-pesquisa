import { DeleteSurveyUseCase } from '@/domain/use-cases/survey/delete-survey'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import {
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  Param,
  NotFoundException,
} from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

@Controller('/surveys/:id')
export class DeleteSurveyController {
  constructor(private deleteSurvey: DeleteSurveyUseCase) {}

  @Delete()
  @HttpCode(204)
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('id') surveyId: string,
  ) {
    const userId = user.sub

    const result = await this.deleteSurvey.execute({
      accountId: userId,
      surveyId,
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
