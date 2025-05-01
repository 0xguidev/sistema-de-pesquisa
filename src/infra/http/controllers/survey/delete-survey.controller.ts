import { DeleteSurveyUseCase } from '@/domain/use-cases/survey/delete-survey'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  Param,
} from '@nestjs/common'

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
      throw new BadRequestException()
    }
  }
}
